"""
Authoritative Government Portal Registry & Live Scoped Retriever.
Restricts scheme retrieval strictly to official, authenticated government portals:
- myscheme.gov.in (National Unified Scheme Repository)
- mahadbt.maharashtra.gov.in (Maharashtra DBT)
- scholarships.gov.in (National Scholarship Portal)
- pmkisan.gov.in (PM-Kisan)
- beneficiary.nha.gov.in / pmjay.gov.in (Ayushman Bharat)
- pmsvanidhi.mohua.gov.in (PM SVANidhi)
- pmaymis.gov.in & pmayg.nic.in (PMAY Housing)
- ladkibahin.maharashtra.gov.in (Maharashtra Ladki Bahin)
- services.india.gov.in / india.gov.in (National Services Directory)
"""

import logging
import re
from typing import List, Dict, Any, Optional
import httpx
from bs4 import BeautifulSoup
from duckduckgo_search import DDGS

logger = logging.getLogger("nagrik_gov_registry")

# Whitelist of trusted official government domains for scheme data
AUTHORITATIVE_DOMAINS = [
    "myscheme.gov.in",
    "mahadbt.maharashtra.gov.in",
    "scholarships.gov.in",
    "pmkisan.gov.in",
    "pmjay.gov.in",
    "nha.gov.in",
    "pmsvanidhi.mohua.gov.in",
    "services.india.gov.in",
    "india.gov.in",
    "pmaymis.gov.in",
    "pmayg.nic.in",
    "ladkibahin.maharashtra.gov.in",
    "pmuy.gov.in",
    "pmvishwakarma.gov.in",
    "mudra.org.in",
    "nsdl.co.in",
    "gov.in",
    "nic.in",
]

PORTAL_NAMES = {
    "myscheme.gov.in": "myScheme National Unified Portal",
    "mahadbt.maharashtra.gov.in": "MahaDBT Maharashtra State Portal",
    "scholarships.gov.in": "National Scholarship Portal (NSP)",
    "pmkisan.gov.in": "PM-KISAN Samman Nidhi Portal",
    "pmjay.gov.in": "Ayushman Bharat PM-JAY Portal",
    "nha.gov.in": "National Health Authority PM-JAY Beneficiary Portal",
    "pmsvanidhi.mohua.gov.in": "PM SVANidhi Portal (MoHUA)",
    "services.india.gov.in": "National Government Services Portal",
    "pmaymis.gov.in": "Pradhan Mantri Awas Yojana (Urban)",
    "pmayg.nic.in": "Pradhan Mantri Awas Yojana (Gramin)",
    "ladkibahin.maharashtra.gov.in": "Majhi Ladki Bahin Portal (Maharashtra)",
    "pmuy.gov.in": "PM Ujjwala Yojana Portal",
    "pmvishwakarma.gov.in": "PM Vishwakarma Official Portal",
    "mudra.org.in": "PMMY MUDRA Portal",
}

# Curated high-demand verified authoritative government scheme registry
# Provides instant zero-latency official guidelines and exact government URLs
KNOWN_AUTHORITATIVE_SCHEMES = [
    {
        "id": "pm-svanidhi",
        "title": "PM SVANidhi (Pradhan Mantri Street Vendor's AtmaNirbhar Nidhi)",
        "portal": "Ministry of Housing and Urban Affairs Portal",
        "url": "https://pmsvanidhi.mohua.gov.in/",
        "keywords": ["svanidhi", "street vendor", "vendor loan", "रेहड़ी", "पटरी", "स्ट्रीट वेंडर", "स्वनिधि"],
        "summary": "Working capital micro-loans for street vendors up to ₹50,000 with 7% interest subsidy and cashback.",
        "text": (
            "PM Street Vendor's AtmaNirbhar Nidhi (PM SVANidhi) is an initiative by the Ministry of Housing and Urban Affairs (MoHUA) "
            "to facilitate collateral-free working capital loans to street vendors. "
            "Benefits: 1st Tranche loan up to ₹10,000 with 1-year tenure. On timely or early repayment, eligible for 2nd tranche up to ₹20,000, "
            "and 3rd tranche up to ₹50,000. Interest subsidy of 7% per annum credited directly to beneficiary bank account. "
            "Cashback incentive of up to ₹1,200/year (₹100/month) on digital transactions. "
            "Eligibility: Street vendors engaged in vending in urban areas on or before March 24, 2020, possessing Certificate of Vending / ID Card "
            "issued by Urban Local Bodies (ULBs) or letter of recommendation. "
            "Required Documents: Aadhaar Card, Voter ID, Proof of vending (Vending certificate/ULB ID), Bank passbook. "
            "How to apply: Apply online directly at https://pmsvanidhi.mohua.gov.in/ or through Common Service Centres (CSCs)."
        ),
    },
    {
        "id": "ayushman-bharat",
        "title": "Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (PM-JAY)",
        "portal": "National Health Authority Portal",
        "url": "https://beneficiary.nha.gov.in/",
        "keywords": ["ayushman", "pmjay", "pm-jay", "golden card", "health card", "आयुष्मान", "जन आरोग्य", "हेल्थ कार्ड"],
        "summary": "Health insurance cover of ₹5 lakh per family per year for secondary and tertiary care hospitalization.",
        "text": (
            "Ayushman Bharat PM-JAY is the world's largest government-funded health assurance scheme implemented by the National Health Authority (NHA). "
            "Benefits: Health cover of ₹5,00,000 per family per year for secondary and tertiary healthcare across empanelled public and private hospitals. "
            "Covers 3 days of pre-hospitalization and 15 days of post-hospitalization expenses, medicines, tests, and ICU care. "
            "Completely cashless and paperless at point of service. All pre-existing conditions covered from day one. "
            "Eligibility: Over 12 crore poor and vulnerable families identified based on SECC 2011 deprivation criteria and NFSA ration card databases. "
            "Senior citizens aged 70 and above receive an additional ₹5 lakh dedicated top-up cover irrespective of income. "
            "Required Documents: Aadhaar card, Ration card, Mobile number. "
            "How to apply: Verify eligibility and generate Ayushman Card at https://beneficiary.nha.gov.in/ or visit any empanelled hospital PMAM kiosk."
        ),
    },
    {
        "id": "pm-awas-yojana",
        "title": "Pradhan Mantri Awas Yojana (PMAY Urban & Gramin)",
        "portal": "Ministry of Housing and Urban Affairs Portal",
        "url": "https://pmaymis.gov.in/",
        "keywords": ["pm awas", "pmay", "awas yojana", "housing", "आवास योजना", "घरकुल", "मकान"],
        "summary": "Financial assistance and interest subsidy for building or purchasing a pucca house for homeless and low-income families.",
        "text": (
            "Pradhan Mantri Awas Yojana (PMAY) provides pucca houses with basic amenities to all eligible urban and rural homeless families. "
            "Urban (PMAY-U): Central assistance up to ₹1.5 lakh for Beneficiary-led Construction (BLC) and Credit Linked Subsidy Scheme (CLSS) "
            "interest subsidy up to 6.5% on home loans for EWS/LIG families. "
            "Gramin (PMAY-G): Financial assistance of ₹1.20 lakh in plain areas and ₹1.30 lakh in hilly/difficult areas for house construction, "
            "plus 90/95 days of unskilled labor wages under MGNREGA and ₹12,000 for toilet construction under Swachh Bharat Mission. "
            "Eligibility: Beneficiary family must not own a pucca house anywhere in India. EWS household annual income up to ₹3 lakh; LIG up to ₹6 lakh. "
            "Required Documents: Aadhaar card, Income certificate, Bank account details, Land record / house site document. "
            "How to apply: Urban applicants apply via https://pmaymis.gov.in/ or CSC. Rural applicants apply through Gram Panchayat / https://pmayg.nic.in/."
        ),
    },
    {
        "id": "ladki-bahin-maharashtra",
        "title": "Mukhyamantri Majhi Ladki Bahin Yojana (Maharashtra)",
        "portal": "Government of Maharashtra Portal",
        "url": "https://ladkibahin.maharashtra.gov.in/",
        "keywords": ["ladki bahin", "ladli behna", "माझी लाडकी बहीण", "लाडकी बहीण", "maharashtra women scheme"],
        "summary": "Monthly financial assistance of ₹1,500 deposited directly into Aadhaar-linked bank accounts of eligible women in Maharashtra.",
        "text": (
            "Mukhyamantri Majhi Ladki Bahin Yojana is implemented by the Women and Child Development Department, Government of Maharashtra. "
            "Benefits: Direct benefit transfer (DBT) of ₹1,500 per month directly into the Aadhaar-linked bank accounts of eligible female beneficiaries. "
            "Eligibility: Married, widowed, divorced, abandoned, and destitute women aged 21 to 65 years who are permanent residents of Maharashtra. "
            "Annual family income from all sources must not exceed ₹2.50 lakh. Family must not pay income tax or have a government employee. "
            "Required Documents: Aadhaar Card, Maharashtra Domicile Certificate (or Ration Card/Voter ID showing 15 years residency), "
            "Income Certificate or Yellow/Orange Ration Card, Bank Passbook (Aadhaar linked), Hamipatra (Declaration). "
            "How to apply: Apply online at https://ladkibahin.maharashtra.gov.in/ or via Nari Shakti Doot App or Gram Panchayat / Anganwadi centre."
        ),
    },
    {
        "id": "sukanya-samriddhi",
        "title": "Sukanya Samriddhi Yojana (SSY)",
        "portal": "myScheme National Unified Portal",
        "url": "https://www.myscheme.gov.in/schemes/ssy",
        "keywords": ["sukanya", "sukanya samriddhi", "सुकन्या समृद्धी", "सुकन्या समृद्धि", "girl child savings"],
        "summary": "Government-backed savings scheme for girl children with 8.2% annual interest and tax exemption under Section 80C.",
        "text": (
            "Sukanya Samriddhi Yojana (SSY) is a dedicated small savings scheme under Beti Bachao Beti Padhao. "
            "Benefits: Sovereign guarantee with high interest rate (currently 8.2% p.a., compounded annually). "
            "Triple tax benefits (EEE): deposits exempt under Section 80C, interest earned is tax-free, maturity amount is completely tax-free. "
            "Eligibility: Opened by natural/legal guardians for a girl child from birth up to 10 years of age. Maximum 2 accounts per family (except twins/triplets). "
            "Deposit: Minimum ₹250 and maximum ₹1.50 lakh per financial year. Deposits allowed for 15 years from account opening. "
            "Maturity: Matures after 21 years or upon marriage of the girl after attaining 18 years of age. Partial withdrawal (up to 50%) permitted for higher education after age 18. "
            "How to apply: Visit any authorized Post Office or commercial bank branch with girl child birth certificate and guardian Aadhaar/PAN."
        ),
    },
    {
        "id": "atal-pension-yojana",
        "title": "Atal Pension Yojana (APY)",
        "portal": "Pension Fund Regulatory and Development Authority (PFRDA)",
        "url": "https://www.npscra.nsdl.co.in/",
        "keywords": ["atal pension", "apy", "अटल पेंशन", "पेन्शन", "pension scheme"],
        "summary": "Guaranteed minimum monthly pension of ₹1,000 to ₹5,000 per month starting from age 60 for unorganized workers.",
        "text": (
            "Atal Pension Yojana (APY) is a social security scheme administered by PFRDA for all citizens in the unorganized sector. "
            "Benefits: Guaranteed minimum monthly pension of ₹1,000, ₹2,000, ₹3,000, ₹4,000, or ₹5,000 per month starting at age 60 until death. "
            "After subscriber's death, identical pension continues to spouse for life. After death of both subscriber and spouse, "
            "the entire pension wealth accumulated is returned to the nominee. "
            "Eligibility: Any Indian citizen aged 18 to 40 years holding a savings bank account. Must not be an income taxpayer. "
            "Required Documents: Bank/Post office savings account details, Aadhaar card, mobile number. "
            "How to apply: Apply through net banking of your bank or visit the bank branch where you have a savings account."
        ),
    },
    {
        "id": "pm-ujjwala-yojana",
        "title": "Pradhan Mantri Ujjwala Yojana (PMUY)",
        "portal": "Ministry of Petroleum and Natural Gas",
        "url": "https://www.pmuy.gov.in/",
        "keywords": ["ujjwala", "lpg", "gas cylinder", "उज्ज्वला", "गॅस", "एलपीजी"],
        "summary": "Deposit-free LPG connections with ₹300 per cylinder targeted subsidy for rural and deprived households.",
        "text": (
            "Pradhan Mantri Ujjwala Yojana (PMUY) provides clean cooking fuel to rural and deprived households. "
            "Benefits: Free LPG connection with financial assistance of ₹1,600 covering security deposit of cylinder, pressure regulator, safety hose, "
            "DGCC booklet and inspection charges. In addition, beneficiaries receive ₹300 per cylinder targeted subsidy for up to 12 refills per year. "
            "First refill and hotplate (stove) provided free of cost with option for EMI. "
            "Eligibility: Adult woman belonging to poor/BPL household, SC/ST, PM Awas Yojana beneficiary, or Antyodaya Anna Yojana cardholder. "
            "No member of the household should have an existing LPG connection. "
            "Required Documents: Aadhaar Card, Ration Card proving family composition, Bank Passbook, 14-point declaration. "
            "How to apply: Apply online at https://www.pmuy.gov.in/ or submit physical application to nearest LPG distributor (Indane, BharatGas, HP Gas)."
        ),
    },
    {
        "id": "pm-mudra-yojana",
        "title": "Pradhan Mantri MUDRA Yojana (PMMY)",
        "portal": "MUDRA Official Portal",
        "url": "https://www.mudra.org.in/",
        "keywords": ["mudra", "mudra loan", "मुद्रा लोन", "मुद्रा योजना", "small business loan"],
        "summary": "Collateral-free business loans up to ₹10 lakh for small and micro non-corporate enterprises.",
        "text": (
            "Pradhan Mantri MUDRA Yojana (PMMY) facilitates institutional credit up to ₹10 lakh to micro/small enterprises. "
            "Three Categories: 1) Shishu: loans up to ₹50,000 for startup entrepreneurs; 2) Kishore: loans from ₹50,001 up to ₹5,00,000; "
            "3) Tarun: loans from ₹5,00,001 up to ₹10,00,000 for established units seeking expansion. "
            "Features: No collateral security required. Zero processing fee for Shishu and Kishore loans. Competitive interest rates linked to RBI repo rate. "
            "Eligibility: Any Indian citizen having a business plan for non-farm income-generating activity such as manufacturing, processing, trading, or service sector. "
            "Required Documents: Proof of identity (Aadhaar/Voter ID), Proof of residence, Business registration/license, Quotations of machinery/items, Bank statement. "
            "How to apply: Apply online at Udyamimitra Portal (https://www.udyamimitra.in/) or visit any commercial bank, RRB, Small Finance Bank, or MFI."
        ),
    },
    {
        "id": "pm-vishwakarma",
        "title": "PM Vishwakarma Scheme",
        "portal": "Ministry of Micro, Small and Medium Enterprises",
        "url": "https://pmvishwakarma.gov.in/",
        "keywords": ["vishwakarma", "artisan", "carpenter", "blacksmith", "विश्वकर्मा", "कारागीर", "craftsperson"],
        "summary": "Holistic support for traditional artisans including ₹15,000 toolkit e-voucher and collateral-free loans up to ₹3 lakh at 5% interest.",
        "text": (
            "PM Vishwakarma provides comprehensive support to artisans and craftspeople who work with hands and tools across 18 traditional trades "
            "(carpenter, blacksmith, goldsmith, potter, sculptor, cobbler, tailor, mason, barber, garland maker, washerman, etc.). "
            "Benefits: 1) Recognition through PM Vishwakarma Certificate and ID Card. "
            "2) Skill upgrading: 5-7 days basic training and 15+ days advanced training with ₹500/day stipend. "
            "3) Toolkit incentive: e-voucher of ₹15,000 to purchase modern tools. "
            "4) Collateral-free credit support: 1st tranche up to ₹1,00,000 (18 months tenure) and 2nd tranche up to ₹2,00,000 (30 months tenure) at concessional 5% interest. "
            "5) Digital transaction incentive: ₹1 per transaction up to 100 transactions/month. "
            "Eligibility: Artisan practicing one of the 18 traditional trades, minimum age 18, one beneficiary per family, not availed similar credit loans (PMEGP/MUDRA). "
            "How to apply: Register online through Common Service Centres (CSC) with biometric authentication at https://pmvishwakarma.gov.in/."
        ),
    },
]


def is_authoritative_gov_url(url: str) -> bool:
    """Verifies that a URL strictly belongs to our approved government portal whitelist."""
    if not url:
        return False
    url_lower = url.lower()
    return any(domain in url_lower for domain in AUTHORITATIVE_DOMAINS)


def get_portal_name_for_url(url: str) -> str:
    url_lower = url.lower()
    for domain, name in PORTAL_NAMES.items():
        if domain in url_lower:
            return name
    return "Official Government of India Portal"


def fetch_official_page_text(url: str, timeout: float = 4.0) -> Optional[str]:
    """Fetches and extracts clean, readable text from an official government page."""
    try:
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
            )
        }
        with httpx.Client(timeout=timeout, verify=False, follow_redirects=True) as client:
            resp = client.get(url, headers=headers)
            if resp.status_code != 200:
                return None

            soup = BeautifulSoup(resp.text, "html.parser")
            for elem in soup(["script", "style", "nav", "footer", "header", "noscript", "svg"]):
                elem.decompose()

            lines = [line.strip() for line in soup.get_text().split("\n") if line.strip()]
            full_text = " ".join(lines)
            clean_text = re.sub(r"\s+", " ", full_text).strip()
            return clean_text[:2500] if len(clean_text) > 100 else None
    except Exception as e:
        logger.warning(f"Could not scrape {url}: {e}")
        return None


def match_curated_portal_scheme(query: str) -> Optional[Dict[str, Any]]:
    """Checks if query targets one of our curated authoritative government schemes."""
    q_lower = query.lower()
    for scheme in KNOWN_AUTHORITATIVE_SCHEMES:
        for kw in scheme["keywords"]:
            if kw in q_lower:
                return scheme
    return None


def search_authoritative_gov_portals(query: str, max_results: int = 3) -> List[Dict[str, Any]]:
    """
    Executes a search scoped strictly to our authoritative government portal registry.
    First checks instant curated authoritative portals, then executes live DDGS search.
    Returns standard chunk dictionaries formatted for NagrikAI retrieval & explanation.
    """
    results: List[Dict[str, Any]] = []

    # 1. First check curated registry for instant high-confidence match
    curated = match_curated_portal_scheme(query)
    if curated:
        results.append({
            "chunk_id": f"gov_registry_{curated['id']}",
            "scheme_id": curated["id"],
            "title": f"{curated['title']} [{curated['portal']}]",
            "section": "Official Guidelines & Eligibility",
            "page": 1,
            "url": curated["url"],
            "text": curated["text"],
            "metadata": {
                "scheme_id": curated["id"],
                "title": curated["title"],
                "url": curated["url"],
                "page": 1,
                "portal": curated["portal"],
                "summary": curated["summary"],
                "live_source": True,
            }
        })
        if len(results) >= max_results:
            return results

    # 2. Live Scoped Search on official government portals via DDGS
    # Clean query for optimal DDGS matching
    clean_q = re.sub(r"[^\w\s\u0900-\u097F]", " ", query).strip()
    search_queries = [
        f"{clean_q} myscheme",
        clean_q,
    ]

    for search_term in search_queries:
        if len(results) >= max_results:
            break
        try:
            ddgs = DDGS()
            # Try html backend first, fallback to auto
            raw_results = None
            try:
                raw_results = ddgs.text(search_term, backend="html", max_results=6)
            except Exception:
                try:
                    raw_results = ddgs.text(search_term, backend="auto", max_results=6)
                except Exception:
                    pass

            if not raw_results:
                continue

            for item in raw_results:
                href = item.get("href", "")
                if is_authoritative_gov_url(href):
                    title = item.get("title", "Government Scheme")
                    snippet = item.get("body", "")
                    portal_label = get_portal_name_for_url(href)

                    # Only add if not already in results
                    if any(r["url"] == href for r in results):
                        continue

                    # Try quick page text fetch, fall back to search snippet
                    scraped = fetch_official_page_text(href, timeout=3.0)
                    chunk_text = scraped if scraped else snippet

                    if chunk_text and len(chunk_text.strip()) > 40:
                        results.append({
                            "chunk_id": f"gov_live_{len(results) + 1}",
                            "scheme_id": "official-gov-portal",
                            "title": f"{title} [{portal_label}]",
                            "section": "Official Guidelines",
                            "page": 1,
                            "url": href,
                            "text": chunk_text,
                            "metadata": {
                                "scheme_id": "official-gov-portal",
                                "title": title,
                                "url": href,
                                "page": 1,
                                "portal": portal_label,
                                "live_source": True,
                            }
                        })
                    if len(results) >= max_results:
                        break
        except Exception as e:
            logger.warning(f"Authoritative live search error for query '{search_term}': {e}")

    return results
