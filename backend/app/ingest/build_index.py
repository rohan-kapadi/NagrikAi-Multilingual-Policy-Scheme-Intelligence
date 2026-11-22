import os
import re
from pathlib import Path
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings as ChromaSettings
from sentence_transformers import SentenceTransformer
from backend.app.config import settings
from backend.app.data_loader import load_all_schemes

DATA_SOURCES_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "sources"
CHROMA_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "chroma"
COLLECTION_NAME = "nagrik_schemes"

# Initialize embedding model lazily
_model: Optional[SentenceTransformer] = None


def get_embedding_model() -> SentenceTransformer:
    global _model
    if _model is None:
        print(f"Loading embedding model: {settings.EMBEDDING_MODEL}...")
        _model = SentenceTransformer(settings.EMBEDDING_MODEL)
    return _model


def chunk_markdown_file(file_path: Path, scheme_meta: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """
    Chunks a markdown file by sections and sub-paragraphs with metadata.
    """
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
            # Header encountered, flush previous section if not empty
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
    
    # Reset or get collection
    try:
        client.delete_collection(name=COLLECTION_NAME)
    except Exception:
        pass
    collection = client.create_collection(
        name=COLLECTION_NAME,
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
    model = get_embedding_model()

    # all-MiniLM-L6-v2 does NOT need prefixes; E5 models do.
    # Detect by model name from settings.
    use_e5_prefix = "e5" in settings.EMBEDDING_MODEL.lower()
    texts = [f"passage: {c['text']}" if use_e5_prefix else c['text'] for c in all_chunks]
    embeddings = model.encode(texts, normalize_embeddings=True).tolist()
    
    ids = [c["chunk_id"] for c in all_chunks]
    documents = [c["text"] for c in all_chunks]
    metadatas = [{
        "scheme_id": c["scheme_id"],
        "title": c["title"],
        "section": c["section"],
        "page": c["page"],
        "url": c["url"]
    } for c in all_chunks]
    
    collection.add(
        ids=ids,
        embeddings=embeddings,
        documents=documents,
        metadatas=metadatas
    )
    print(f"Successfully indexed {len(all_chunks)} chunks into '{COLLECTION_NAME}'.")
    return len(all_chunks)


def search_chunks(query: str, top_k: int = 3, scheme_id: Optional[str] = None) -> List[Dict[str, Any]]:
    client = chromadb.PersistentClient(path=str(CHROMA_DIR))
    try:
        collection = client.get_collection(name=COLLECTION_NAME)
    except Exception:
        return []
        
    model = get_embedding_model()
    # E5 models benefit from "query: " prefix on search queries
    use_e5_prefix = "e5" in settings.EMBEDDING_MODEL.lower()
    query_text = f"query: {query}" if use_e5_prefix else query
    query_embedding = model.encode([query_text], normalize_embeddings=True).tolist()
    
    where_filter = {"scheme_id": scheme_id} if scheme_id else None
    
    results = collection.query(
        query_embeddings=query_embedding,
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
