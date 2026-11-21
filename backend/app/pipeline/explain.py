from typing import List, Dict, Any, Optional, Tuple
from backend.app.models import Scheme, EligibilityResult
from backend.app.llm.client import llm_client
from backend.app.llm.prompts import EXPLANATION_PROMPT, CHITCHAT_RESPONSES

DISCLAIMERS = {
    "en": "Disclaimer: NagrikAI is an informational tool. Eligibility decisions are made solely by official government portals and competent authorities.",
    "hi": "अस्वीकरण: नागरिक AI केवल सूचनात्मक मार्गदर्शन प्रदान करता है। पात्रता और लाभों पर अंतिम निर्णय केवल आधिकारिक सरकारी पोर्टल और संबंधित प्राधिकरणों द्वारा लिया जाता है।",
    "mr": "अस्वीकरण: नागरिक AI केवळ माहितीच्या उद्देशाने मार्गदर्शन पुरवतो. पात्रतेचा अंतिम निर्णय अधिकृत सरकारी पोर्टल आणि संबंधित प्राधिकरणांचा असेल."
}


def build_deterministic_explanation(
    user_message: str,
    language: str,
    intent: str,
    schemes: List[Scheme],
    eligibility_results: List[EligibilityResult],
    chunks: List[Dict[str, Any]],
    clarifying_question: Optional[str] = None
) -> str:
    """
    Grounded multilingual answer generator.
    Produces clear, school-student reading level explanations grounded strictly in scheme data.
    """
    lang = language if language in ["en", "hi", "mr"] else "en"

    # If clarifying question is needed
    if clarifying_question:
        if lang == "hi":
            return f"आपकी पात्रता और उपयुक्त योजनाओं की सटीक जानकारी देने के लिए, मुझे थोड़ी और जानकारी चाहिए:\n\n{clarifying_question}"
        elif lang == "mr":
            return f"आपल्या पात्रतेची अचूक माहिती देण्यासाठी, मला थोडी अधिक माहिती आवश्यक आहे:\n\n{clarifying_question}"
        else:
            return f"To evaluate your eligibility and find the right schemes, I need a little more information:\n\n{clarifying_question}"

    # Chitchat response
    if intent == "chitchat":
        return CHITCHAT_RESPONSES.get(lang, CHITCHAT_RESPONSES["en"])

    # Out-of-domain / ungrounded question check
    # If a question was asked (has "?") but no chunks were retrieved — the answer is not in the source
    lower_msg = user_message.lower()
    is_specific_question = intent == "ask_question" and "?" in lower_msg
    no_chunks = not chunks
    # Also catch known out-of-domain topics not found in chunk content
    ood_phrases = ["tractor", "ट्रैक्टर", "ट्रॅक्टर", "loan waiver", "कर्ज माफी", "free seed", "मुफ्त बीज",
                   "diesel subsidy"]
    has_ood_phrase = any(tw in lower_msg for tw in ood_phrases)
    phrase_in_chunks = any(tw in c.get("text", "").lower() for c in chunks for tw in ood_phrases)
    has_live_chunks = any(c.get("metadata", {}).get("live_source") for c in chunks)

    if (is_specific_question and no_chunks) or (has_ood_phrase and not phrase_in_chunks and not has_live_chunks):
        portal_url = schemes[0].official_url if schemes else "https://india.gov.in"
        if lang == "hi":
            return f"यह जानकारी उपलब्ध स्रोत में निर्दिष्ट नहीं है (not specified in the source)। इस विषय का कोई विवरण उपलब्ध आधिकारिक दिशानिर्देशों में नहीं मिला। अधिक जानकारी के लिए आधिकारिक पोर्टल देखें: {portal_url}"
        elif lang == "mr":
            return f"ही माहिती उपलब्ध स्रोतामध्ये नमूद केलेली नाही (not specified in the source). उपलब्ध अधिकृत मार्गदर्शक तत्त्वांमध्ये याचा तपशील आढळला नाही. कृपया अधिक माहितीसाठी अधिकृत पोर्टल तपासा: {portal_url}"
        else:
            return f"This information is not specified in the source. No details about this were found in the available official guidelines. Please refer to the official portal for authoritative information: {portal_url}"

    # Discover intent: list schemes and explain why relevant
    if intent == "discover":
        lines: List[str] = []
        if lang == "hi":
            lines.append("आपकी जानकारी के आधार पर निम्नलिखित सरकारी योजनाएं आपके लिए उपयुक्त हैं:\n")
            for s in schemes:
                name = s.name.get("hi", s.name.get("en", s.id))
                summary = s.summary.get("hi", s.summary.get("en", ""))
                benefits = s.benefits.get("hi", s.benefits.get("en", ""))
                lines.append(f"📌 **{name}**")
                lines.append(f"- **विवरण:** {summary}")
                lines.append(f"- **लाभ:** {benefits}")
                lines.append(f"- **आधिकारिक पोर्टल:** {s.official_url}\n")
        elif lang == "mr":
            lines.append("आपल्या माहितीच्या आधारे खालील सरकारी योजना आपल्यासाठी उपयुक्त ठरू शकतात:\n")
            for s in schemes:
                name = s.name.get("mr", s.name.get("en", s.id))
                summary = s.summary.get("mr", s.summary.get("en", ""))
                benefits = s.benefits.get("mr", s.benefits.get("en", ""))
                lines.append(f"📌 **{name}**")
                lines.append(f"- **तपशील:** {summary}")
                lines.append(f"- **मिळणारे लाभ:** {benefits}")
                lines.append(f"- **अधिकृत पोर्टल:** {s.official_url}\n")
        else:
            lines.append("Based on your profile, here are relevant government schemes you may qualify for:\n")
            for s in schemes:
                name = s.name.get("en", s.id)
                summary = s.summary.get("en", "")
                benefits = s.benefits.get("en", "")
                lines.append(f"📌 **{name}**")
                lines.append(f"- **Summary:** {summary}")
                lines.append(f"- **Benefits:** {benefits}")
                lines.append(f"- **Official Portal:** {s.official_url}\n")

        return "\n".join(lines).strip()

    # Eligibility evaluation intent
    if intent in ["eligibility", "ask_question"]:
        lines = []
        for res in eligibility_results:
            scheme = next((s for s in schemes if s.id == res.scheme_id), None)
            scheme_title = scheme.name.get(lang, scheme.name.get("en", res.scheme_id)) if scheme else res.scheme_id

            if lang == "hi":
                if not res.criteria_results:
                    summary_text = scheme.summary.get("hi", scheme.summary.get("en", "")) if scheme else ""
                    lines.append(f"### {scheme_title}")
                    lines.append(f"**आधिकारिक दिशानिर्देश एवं विवरण:** {summary_text}\n")
                    if chunks:
                        lines.append(f"• {chunks[0]['text'][:300]}...\n")
                else:
                    status_text = "पात्र हैं (Eligible)" if res.overall == "eligible" else "पात्र नहीं हैं (Not Eligible)" if res.overall == "not_eligible" else "और जानकारी आवश्यक है (Needs More Info)"
                    lines.append(f"### {scheme_title}")
                    lines.append(f"**पात्रता स्थिति:** {status_text}\n")
                    lines.append("**पात्रता मानदंड समीक्षा:**")
                    for cr in res.criteria_results:
                        icon = "✅" if cr.status == "met" else "❌" if cr.status == "not_met" else "❓"
                        lines.append(f"- {icon} {cr.label} (आवश्यकता: {cr.required})")
                if res.required_documents:
                    lines.append("\n**आवश्यक दस्तावेज:**")
                    for doc in res.required_documents:
                        lines.append(f"- 📄 {doc}")
                if scheme:
                    lines.append(f"\n**आवेदन कैसे करें:** {scheme.how_to_apply.get('hi', scheme.how_to_apply.get('en', ''))}")
                    lines.append(f"**आधिकारिक लिंक:** [{scheme.official_url}]({scheme.official_url})\n")
            elif lang == "mr":
                if not res.criteria_results:
                    summary_text = scheme.summary.get("mr", scheme.summary.get("en", "")) if scheme else ""
                    lines.append(f"### {scheme_title}")
                    lines.append(f"**अधिकृत तपशील व मार्गदर्शक तत्त्वे:** {summary_text}\n")
                    if chunks:
                        lines.append(f"• {chunks[0]['text'][:300]}...\n")
                else:
                    status_text = "पात्र आहात (Eligible)" if res.overall == "eligible" else "पात्र नाही (Not Eligible)" if res.overall == "not_eligible" else "अधिक माहिती आवश्यक आहे (Needs More Info)"
                    lines.append(f"### {scheme_title}")
                    lines.append(f"**पात्रता स्थिती:** {status_text}\n")
                    lines.append("**पात्रता निकष पडताळणी:**")
                    for cr in res.criteria_results:
                        icon = "✅" if cr.status == "met" else "❌" if cr.status == "not_met" else "❓"
                        lines.append(f"- {icon} {cr.label} (आवश्यक: {cr.required})")
                if res.required_documents:
                    lines.append("\n**आवश्यक कागदपत्रे:**")
                    for doc in res.required_documents:
                        lines.append(f"- 📄 {doc}")
                if scheme:
                    lines.append(f"\n**अर्ज कसा करावा:** {scheme.how_to_apply.get('mr', scheme.how_to_apply.get('en', ''))}")
                    lines.append(f"**अधिकृत लिंक:** [{scheme.official_url}]({scheme.official_url})\n")
            else:
                if not res.criteria_results:
                    summary_text = scheme.summary.get("en", "") if scheme else ""
                    lines.append(f"### {scheme_title}")
                    lines.append(f"**Official Guidelines & Overview:** {summary_text}\n")
                    if chunks:
                        lines.append(f"• {chunks[0]['text'][:300]}...\n")
                else:
                    status_text = "Eligible" if res.overall == "eligible" else "Not Eligible" if res.overall == "not_eligible" else "Needs More Information"
                    lines.append(f"### {scheme_title}")
                    lines.append(f"**Eligibility Status:** {status_text}\n")
                    lines.append("**Criteria Assessment:**")
                    for cr in res.criteria_results:
                        icon = "✅" if cr.status == "met" else "❌" if cr.status == "not_met" else "❓"
                        lines.append(f"- {icon} {cr.label} (Required: {cr.required})")
                if res.required_documents:
                    lines.append("\n**Required Documents:**")
                    for doc in res.required_documents:
                        lines.append(f"- 📄 {doc}")
                if scheme:
                    lines.append(f"\n**How to Apply:** {scheme.how_to_apply.get('en', '')}")
                    lines.append(f"**Official Portal:** [{scheme.official_url}]({scheme.official_url})\n")

        if lines:
            return "\n".join(lines).strip()

    # Fallback to general chunk context if available
    if chunks:
        chunk_texts = [f"• {c['text']}" for c in chunks[:2]]
        return "\n\n".join(chunk_texts)

    return "Please specify your query or tell me about your background."


def explain(
    user_message: str,
    language: str,
    intent: str,
    schemes: List[Scheme],
    eligibility_results: List[EligibilityResult],
    chunks: List[Dict[str, Any]],
    clarifying_question: Optional[str] = None
) -> Tuple[str, str]:
    """
    Main explanation function returning (answer, disclaimer).
    Uses LLM when API key is configured; otherwise uses deterministic grounded generator.
    """
    lang = language if language in ["en", "hi", "mr"] else "en"
    disclaimer = DISCLAIMERS.get(lang, DISCLAIMERS["en"])

    # If clarifying question is active, return directly without LLM delay
    if clarifying_question:
        answer = build_deterministic_explanation(
            user_message, lang, intent, schemes, eligibility_results, chunks, clarifying_question
        )
        return answer, disclaimer

    # Run out-of-domain / ungrounded check BEFORE calling LLM
    # so we never let the LLM hallucinate facts not in our source corpus
    lower_msg = user_message.lower()
    is_specific_question = intent == "ask_question" and "?" in lower_msg
    no_chunks = not chunks
    ood_phrases = ["tractor", "ट्रैक्टर", "ट्रॅक्टर", "loan waiver", "कर्ज माफी", "free seed", "मुफ्त बीज",
                   "diesel subsidy"]
    has_ood_phrase = any(tw in lower_msg for tw in ood_phrases)
    phrase_in_chunks = any(tw in c.get("text", "").lower() for c in chunks for tw in ood_phrases)
    has_live_chunks = any(c.get("metadata", {}).get("live_source") for c in chunks)

    if (is_specific_question and no_chunks) or (has_ood_phrase and not phrase_in_chunks and not has_live_chunks):
        portal_url = schemes[0].official_url if schemes else "https://india.gov.in"
        if lang == "hi":
            answer = f"यह जानकारी उपलब्ध स्रोत में निर्दिष्ट नहीं है (not specified in the source)। इस विषय का कोई विवरण उपलब्ध आधिकारिक दिशानिर्देशों में नहीं मिला। अधिक जानकारी के लिए आधिकारिक पोर्टल देखें: {portal_url}"
        elif lang == "mr":
            answer = f"ही माहिती उपलब्ध स्रोतामध्ये नमूद केलेली नाही (not specified in the source). उपलब्ध अधिकृत मार्गदर्शक तत्त्वांमध्ये याचा तपशील आढळला नाही. कृपया अधिक माहितीसाठी अधिकृत पोर्टल तपासा: {portal_url}"
        else:
            answer = f"This information is not specified in the source. No details about this were found in the available official guidelines. Please refer to the official portal for authoritative information: {portal_url}"
        return answer, disclaimer

    # If external LLM is available, invoke it with strict grounding prompt
    if llm_client._has_valid_key("groq") or llm_client._has_valid_key("gemini"):
        context_str = "\n\n".join([f"[{c.get('metadata', {}).get('title', 'Scheme')}] {c.get('text', '')}" for c in chunks])
        elig_str = "\n".join([f"Scheme: {r.scheme_id}, Overall: {r.overall}, Criteria: {[c.model_dump() for c in r.criteria_results]}" for r in eligibility_results])
        sys_prompt = EXPLANATION_PROMPT.format(
            language=lang,
            context=context_str or "No direct chunk context.",
            eligibility_results=elig_str or "No eligibility run.",
            user_message=user_message
        )
        llm_answer = llm_client.call_llm_text(sys_prompt, user_message)
        if llm_answer and len(llm_answer.strip()) > 30:
            return llm_answer.strip(), disclaimer

    # Deterministic grounded fallback
    answer = build_deterministic_explanation(
        user_message, lang, intent, schemes, eligibility_results, chunks, clarifying_question
    )
    return answer, disclaimer
