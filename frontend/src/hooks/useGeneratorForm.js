import { useState, useCallback } from 'react';

export const DEFAULT_GENERATOR_FORM = {
  selectedSection: 'chem_phys',
  selectedSubject: '',
  selectedUnit: '',
  selectedTopic: '',
  selectedSubtopic: '',
  selectedSkill: '',
  selectedSubskill: '',
  questionType: 'PASSAGE_BASED_MCQ',
  difficulty: 'medium',
  totalQuestions: 50,
  contentDomains: [],
  contentDomain: '',
  singleChoiceCount: 50,
  multiChoiceCount: 0,
  passageCount: 10,
  passageMode: 'single_passage', // 'single_passage' | 'independent'
  passageQuestionCount: 50,
  passageSingleCount: 50,
  passageMultiCount: 0,
  independentSingleCount: 0,
  independentMultiCount: 0,
  interactionType: 'single_choice',
  passageRequired: 'Yes',
  primaryTrap: 'Automatic',
  likelyMistakePattern: 'Automatic',
  customMistakePattern: '',
  requireImage: false,
  allowAiImages: false,
  imageMode: 'none', // 'none' | 'all' | 'specific'
  imageQuestionIndices: [], // 1-based question numbers e.g. [1, 2]
  requirePassageImage: false,
  customPrompt: ''
};

export function useGeneratorForm(initialValues = {}) {
  const [formData, setFormData] = useState(() => ({
    ...DEFAULT_GENERATOR_FORM,
    ...initialValues
  }));

  const updateField = useCallback((key, value) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const updateFields = useCallback((fieldsObj) => {
    setFormData(prev => ({
      ...prev,
      ...fieldsObj
    }));
  }, []);

  const toggleContentDomain = useCallback((domainId) => {
    setFormData(prev => {
      const current = prev.contentDomains || [];
      const exists = current.includes(domainId);
      const next = exists ? current.filter(d => d !== domainId) : [...current, domainId];
      return {
        ...prev,
        contentDomains: next,
        contentDomain: next.join(', ')
      };
    });
  }, []);

  const toggleQuestionImage = useCallback((qIndex) => {
    setFormData(prev => {
      const current = prev.imageQuestionIndices || [];
      const exists = current.includes(qIndex);
      const next = exists ? current.filter(i => i !== qIndex) : [...current, qIndex].sort((a, b) => a - b);
      const total = prev.totalQuestions || 1;
      let nextMode = 'specific';
      if (next.length === 0 && !prev.requirePassageImage) {
        nextMode = 'none';
      } else if (next.length === total) {
        nextMode = 'all';
      }
      return {
        ...prev,
        imageQuestionIndices: next,
        imageMode: nextMode,
        requireImage: next.length > 0 || prev.requirePassageImage
      };
    });
  }, []);

  const togglePassageImage = useCallback(() => {
    setFormData(prev => {
      const nextPassage = !prev.requirePassageImage;
      const currentIndices = prev.imageQuestionIndices || [];
      return {
        ...prev,
        requirePassageImage: nextPassage,
        requireImage: currentIndices.length > 0 || nextPassage
      };
    });
  }, []);

  const setImageMode = useCallback((mode) => {
    setFormData(prev => {
      const total = prev.totalQuestions || 1;
      if (mode === 'none') {
        return {
          ...prev,
          imageMode: 'none',
          imageQuestionIndices: [],
          requirePassageImage: false,
          requireImage: false
        };
      }
      if (mode === 'all') {
        const allIndices = Array.from({ length: total }, (_, i) => i + 1);
        const isPassage = prev.passageRequired === 'Yes' || prev.passageCount > 0;
        return {
          ...prev,
          imageMode: 'all',
          imageQuestionIndices: allIndices,
          requirePassageImage: isPassage,
          requireImage: true
        };
      }
      // 'specific'
      return {
        ...prev,
        imageMode: 'specific',
        imageQuestionIndices: prev.imageQuestionIndices?.length > 0 ? prev.imageQuestionIndices : [1],
        requireImage: true
      };
    });
  }, []);

  const setImageCount = useCallback((count, candidateIndices = null) => {
    setFormData(prev => {
      const total = prev.totalQuestions || 1;
      const targetList = candidateIndices || Array.from({ length: total }, (_, i) => i + 1);
      const clamped = Math.max(0, Math.min(targetList.length, count));
      const indices = targetList.slice(0, clamped);
      let mode = 'specific';
      if (clamped === 0) mode = 'none';
      else if (clamped === total) mode = 'all';
      return {
        ...prev,
        imageMode: mode,
        imageQuestionIndices: indices,
        requireImage: clamped > 0 || prev.requirePassageImage
      };
    });
  }, []);

  const setRequirePassageImage = useCallback((required) => {
    setFormData(prev => {
      const currentIndices = prev.imageQuestionIndices || [];
      return {
        ...prev,
        requirePassageImage: Boolean(required),
        requireImage: currentIndices.length > 0 || Boolean(required)
      };
    });
  }, []);

  const setSingleImageCount = useCallback((count, singleIndices = [], multiIndices = []) => {
    setFormData(prev => {
      const current = prev.imageQuestionIndices || [];
      const clamped = Math.max(0, Math.min(singleIndices.length, count));
      const newSingleIndices = singleIndices.slice(0, clamped);
      const activeMultiIndices = current.filter(i => multiIndices.includes(i));
      const combined = [...newSingleIndices, ...activeMultiIndices].sort((a, b) => a - b);
      const totalCandidateCount = singleIndices.length + multiIndices.length;
      let mode = 'specific';
      if (combined.length === 0) mode = 'none';
      else if (combined.length === totalCandidateCount && totalCandidateCount > 0) mode = 'all';
      return {
        ...prev,
        imageMode: mode,
        imageQuestionIndices: combined,
        requireImage: combined.length > 0 || prev.requirePassageImage
      };
    });
  }, []);

  const setMultiImageCount = useCallback((count, singleIndices = [], multiIndices = []) => {
    setFormData(prev => {
      const current = prev.imageQuestionIndices || [];
      const clamped = Math.max(0, Math.min(multiIndices.length, count));
      const newMultiIndices = multiIndices.slice(0, clamped);
      const activeSingleIndices = current.filter(i => singleIndices.includes(i));
      const combined = [...activeSingleIndices, ...newMultiIndices].sort((a, b) => a - b);
      const totalCandidateCount = singleIndices.length + multiIndices.length;
      let mode = 'specific';
      if (combined.length === 0) mode = 'none';
      else if (combined.length === totalCandidateCount && totalCandidateCount > 0) mode = 'all';
      return {
        ...prev,
        imageMode: mode,
        imageQuestionIndices: combined,
        requireImage: combined.length > 0 || prev.requirePassageImage
      };
    });
  }, []);

  const resetForm = useCallback((overrides = {}) => {
    setFormData({
      ...DEFAULT_GENERATOR_FORM,
      ...overrides
    });
  }, []);

  const setGenerationTotal = useCallback((total) => {
    const validTotal = [1, 5, 50].includes(total) ? total : (total > 5 ? 50 : (total > 1 ? 5 : 1));
    setFormData(prev => {
      const isPassage = prev.passageMode === 'single_passage';
      return {
        ...prev,
        totalQuestions: validTotal,
        singleChoiceCount: validTotal,
        multiChoiceCount: 0,
        passageCount: isPassage ? (validTotal === 50 ? 10 : 1) : 0,
        passageQuestionCount: isPassage ? validTotal : 0,
        passageSingleCount: isPassage ? validTotal : 0,
        passageMultiCount: 0,
        independentSingleCount: isPassage ? 0 : validTotal,
        independentMultiCount: 0,
        imageQuestionIndices: (prev.imageQuestionIndices || []).filter(idx => idx <= validTotal)
      };
    });
  }, []);

  const setAllowAiImages = useCallback((allowed) => {
    const val = Boolean(allowed);
    setFormData(prev => ({
      ...prev,
      allowAiImages: val,
      requireImage: val,
      requirePassageImage: val,
      imageMode: val ? 'all' : 'none'
    }));
  }, []);

  return {
    formData,
    setFormData,
    updateField,
    updateFields,
    toggleContentDomain,
    toggleQuestionImage,
    togglePassageImage,
    setImageMode,
    setImageCount,
    setSingleImageCount,
    setMultiImageCount,
    setRequirePassageImage,
    setAllowAiImages,
    resetForm,
    setGenerationTotal
  };
}
