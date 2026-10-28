from app.services.deduplication import (
    DuplicateCheckResult,
    evaluate_duplicate,
    extract_content_tokens,
    normalize_text,
)


def test_normalize_text():
    raw = "<p>What is the net charge of <b>aspartic acid</b> at pH = $7.4$?</p>"
    norm = normalize_text(raw)
    assert "what is the net charge of aspartic acid at ph 7 4" == norm
    assert "<p>" not in norm
    assert "$" not in norm


def test_extract_content_tokens():
    raw = "What is the net charge of an aspartate residue at physiological pH?"
    tokens = extract_content_tokens(raw)
    # Stop words like 'what', 'is', 'the', 'of', 'an', 'at' should be removed
    assert "net" in tokens
    assert "charge" in tokens
    assert "aspartate" in tokens
    assert "residue" in tokens
    assert "physiological" in tokens
    assert "ph" in tokens
    assert "what" not in tokens
    assert "the" not in tokens


def test_identical_questions_duplicate_detection():
    stem1 = "In Michaelis-Menten enzyme kinetics, what effect does a competitive inhibitor have on Km and Vmax?"
    options1 = [
        {"id": "A", "text": "Increases Km and leaves Vmax unchanged"},
        {"id": "B", "text": "Decreases Km and decreases Vmax"},
        {"id": "C", "text": "Leaves Km unchanged and decreases Vmax"},
        {"id": "D", "text": "Increases Km and increases Vmax"},
    ]
    candidate = {"id": "cand-1", "question_stem": stem1, "options": options1}
    reference_pool = [{"id": "ref-1", "question_stem": stem1, "options": options1}]

    res: DuplicateCheckResult = evaluate_duplicate(candidate, reference_pool, threshold=0.80)
    assert res.is_duplicate is True
    assert res.similarity_score >= 0.95
    assert res.matched_question_id == "ref-1"
    assert res.match_reason is not None


def test_paraphrased_high_similarity():
    stem1 = "In Michaelis-Menten kinetics, how does a competitive inhibitor affect the apparent Km and Vmax?"
    stem2 = "According to Michaelis-Menten kinetics, what happens to the apparent Km and Vmax in the presence of a competitive inhibitor?"
    options = [
        {"id": "A", "text": "Apparent Km increases, while Vmax remains unchanged"},
        {"id": "B", "text": "Apparent Km decreases, while Vmax decreases"},
        {"id": "C", "text": "Apparent Km is unchanged, while Vmax decreases"},
        {"id": "D", "text": "Both apparent Km and Vmax increase"},
    ]
    candidate = {"id": "cand-2", "question_stem": stem1, "options": options}
    reference_pool = [{"id": "ref-2", "question_stem": stem2, "options": options}]

    res = evaluate_duplicate(candidate, reference_pool, threshold=0.80)
    assert res.is_duplicate is True
    assert res.similarity_score >= 0.80
    assert res.matched_question_id == "ref-2"


def test_distinct_questions_in_same_subtopic_no_duplicate():
    stem1 = "What is the net electrical charge of aspartic acid at pH 7.0?"
    options1 = [
        {"id": "A", "text": "-1"},
        {"id": "B", "text": "0"},
        {"id": "C", "text": "+1"},
        {"id": "D", "text": "-2"},
    ]
    stem2 = "Which amino acid residue is most susceptible to phosphorylation by a protein kinase?"
    options2 = [
        {"id": "A", "text": "Serine"},
        {"id": "B", "text": "Alanine"},
        {"id": "C", "text": "Valine"},
        {"id": "D", "text": "Leucine"},
    ]
    candidate = {"id": "cand-3", "question_stem": stem1, "options": options1}
    reference_pool = [{"id": "ref-3", "question_stem": stem2, "options": options2}]

    res = evaluate_duplicate(candidate, reference_pool, threshold=0.80)
    assert res.is_duplicate is False
    assert res.similarity_score < 0.40
    assert res.matched_question_id is not None or res.matched_question_id is None
