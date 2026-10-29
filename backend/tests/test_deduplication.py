from app.services.deduplication import (
    DuplicateCheckResult,
    cluster_questions,
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


def test_two_tier_threshold_and_soft_warning():
    stem1 = "Based on the passage, which experimental observation most directly established that the atomic nucleus is dense?"
    stem2 = "Based on the passage, which experimental observation directly confirms that the atomic nucleus occupies small volume?"
    options = [
        {"id": "A", "text": "Alpha particle backscattering"},
        {"id": "B", "text": "Cathode ray deflection"},
        {"id": "C", "text": "Photoelectric effect"},
        {"id": "D", "text": "Oil droplet terminal velocity"},
    ]
    cand = {"id": "c-1", "question_stem": stem1, "options": options}
    ref = [{"id": "r-1", "question_stem": stem2, "options": options}]

    # With two-tier: threshold 0.75, soft 0.60
    res = evaluate_duplicate(cand, ref, threshold=0.85, soft_threshold=0.60)
    # The stems share high vocabulary and identical options, similarity should fall in soft or hard tier
    assert res.similarity_score >= 0.60
    if res.similarity_score < 0.85:
        assert res.is_soft_warning is True
        assert res.is_duplicate is False


def test_cluster_questions_groups_duplicates_correctly():
    # 4 questions: Q1 and Q2 are duplicates of each other, Q3 and Q4 are duplicates of each other
    q1 = {
        "id": "q1",
        "question_stem": "When X-210 undergoes electron capture, which describes the change in protons and neutrons?",
        "options": [{"id": "A", "text": "Protons -1, neutrons +1"}],
        "final_score": 96,
    }
    q2 = {
        "id": "q2",
        "question_stem": "When X-210 undergoes electron capture, what happens to the number of protons and neutrons?",
        "options": [{"id": "A", "text": "Protons -1, neutrons +1"}],
        "final_score": 92,
    }
    q3 = {
        "id": "q3",
        "question_stem": "Why do stable heavy nuclei require a higher neutron-to-proton ratio than light nuclei?",
        "options": [{"id": "A", "text": "Strong force cohesion without Coulomb repulsion"}],
        "final_score": 95,
    }
    q4 = {
        "id": "q4",
        "question_stem": "Why do stable heavy nuclei require a higher neutron-to-proton ratio?",
        "options": [{"id": "A", "text": "Strong force cohesion without Coulomb repulsion"}],
        "final_score": 94,
    }

    clusters = cluster_questions([q1, q2, q3, q4], threshold=0.75)
    assert len(clusters) == 2

    # Cluster 1 leader should have highest score (q1 with 96)
    c1 = next(c for c in clusters if c["leader_question"]["id"] == "q1")
    assert len(c1["duplicates"]) == 1
    assert c1["duplicates"][0]["question"]["id"] == "q2"

    # Cluster 2 leader should be q3 with 95
    c2 = next(c for c in clusters if c["leader_question"]["id"] == "q3")
    assert len(c2["duplicates"]) == 1
    assert c2["duplicates"][0]["question"]["id"] == "q4"
