"""
ChromaDB index builder & search interface.

Embedding strategy (memory-conscious):
  - Build time: uses chromadb.utils.embedding_functions.DefaultEmbeddingFunction
    which runs all-MiniLM-L6-v2 via ONNXRuntime — no PyTorch, ~80MB peak RAM.
  - Query time: same function; embeddings computed on-the-fly per query request.
  - sentence-transformers / torch are NOT imported here, keeping the
    FastAPI server well under Render's 512MB free-tier limit.
"""
import os
import re
from pathlib import Path
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.utils import embedding_functions as chroma_ef
from backend.app.config import settings
from backend.app.data_loader import load_all_schemes

DATA_SOURCES_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "sources"
CHROMA_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "chroma"
COLLECTION_NAME = "nagrik_schemes"


def _get_ef():
    """Return ChromaDB's built-in ONNX embedding function (no torch required)."""
    return chroma_ef.DefaultEmbeddingFunction()


def chunk_markdown_file(file_path: Path, scheme_meta: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """Chunks a markdown file by sections with metadata."""
    content = file_path.read_text(encoding="utf-8")
    lines = content.split("\n")

    scheme_id = scheme_meta.get("id", file_path.stem) if scheme_meta else file_path.stem
    official_url = scheme_meta.get("official_url", "") if scheme_meta else ""
    scheme_name = scheme_meta.get("name", {}).get("en", scheme_id) if scheme_meta else scheme_id

    chunks: List[Dict[str, Any]] = []
    current_section = "Overview"
    current_lines: List[str] = []
    chunk_idx = 1

    for line in lines:
        if line.startswith("#"):
            if current_lines:
                text = "\n".join(current_lines).strip()
                if len(text) > 40:
                    chunks.append({
                        "chunk_id": f"{scheme_id}_{chunk_idx}",
                        "scheme_id": scheme_id,
                        "title": scheme_name,
                        "section": current_section,
                        "page": 1,
                        "url": official_url,
                        "text": text
                    })
                    chunk_idx += 1
                current_lines = []
            current_section = line.lstrip("#").strip()
        else:
            current_lines.append(line)

    if current_lines:
        text = "\n".join(current_lines).strip()
        if len(text) > 40:
            chunks.append({
                "chunk_id": f"{scheme_id}_{chunk_idx}",
                "scheme_id": scheme_id,
                "title": scheme_name,
                "section": current_section,
                "page": 1,
                "url": official_url,
                "text": text
            })

    return chunks


def build_and_index():
    schemes = load_all_schemes()
    CHROMA_DIR.mkdir(parents=True, exist_ok=True)

    client = chromadb.PersistentClient(path=str(CHROMA_DIR))

    # Reset or create collection — let ChromaDB manage its own embeddings
    try:
        client.delete_collection(name=COLLECTION_NAME)
    except Exception:
        pass

    ef = _get_ef()
    collection = client.create_collection(
        name=COLLECTION_NAME,
        embedding_function=ef,
        metadata={"hnsw:space": "cosine"}
    )

    all_chunks: List[Dict[str, Any]] = []

    for source_file in DATA_SOURCES_DIR.glob("*.md"):
        scheme_id = source_file.stem
        scheme = schemes.get(scheme_id)
        scheme_meta = scheme.model_dump() if scheme else None
        chunks = chunk_markdown_file(source_file, scheme_meta)
        all_chunks.extend(chunks)

    for source_file in DATA_SOURCES_DIR.glob("*.txt"):
        scheme_id = source_file.stem
        scheme = schemes.get(scheme_id)
        scheme_meta = scheme.model_dump() if scheme else None
        chunks = chunk_markdown_file(source_file, scheme_meta)
        all_chunks.extend(chunks)

    if not all_chunks:
        print("No source chunks found to index.")
        return 0

    print(f"Indexing {len(all_chunks)} chunks into ChromaDB...")

    ids = [c["chunk_id"] for c in all_chunks]
    documents = [c["text"] for c in all_chunks]
    metadatas = [{
        "scheme_id": c["scheme_id"],
        "title": c["title"],
        "section": c["section"],
        "page": c["page"],
        "url": c["url"]
    } for c in all_chunks]

    # ChromaDB calls ef(documents) internally — no torch needed
    collection.add(
        ids=ids,
        documents=documents,
        metadatas=metadatas
    )
    print(f"Successfully indexed {len(all_chunks)} chunks into '{COLLECTION_NAME}'.")
    return len(all_chunks)


def search_chunks(query: str, top_k: int = 3, scheme_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Query ChromaDB using the built-in ONNX embedding function."""
    client = chromadb.PersistentClient(path=str(CHROMA_DIR))
    ef = _get_ef()
    try:
        collection = client.get_collection(name=COLLECTION_NAME, embedding_function=ef)
    except Exception:
        return []

    where_filter = {"scheme_id": scheme_id} if scheme_id else None

    results = collection.query(
        query_texts=[query],
        n_results=top_k,
        where=where_filter
    )

    retrieved = []
    if results and "documents" in results and results["documents"]:
        docs = results["documents"][0]
        metas = results["metadatas"][0] if results.get("metadatas") else []
        dists = results["distances"][0] if results.get("distances") else []
        ids = results["ids"][0] if results.get("ids") else []

        for i in range(len(docs)):
            retrieved.append({
                "chunk_id": ids[i],
                "text": docs[i],
                "metadata": metas[i],
                "distance": dists[i] if i < len(dists) else 0.0
            })

    return retrieved


if __name__ == "__main__":
    build_and_index()
