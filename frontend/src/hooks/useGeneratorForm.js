import { useState, useCallback } from 'react';

export const DEFAULT_GENERATOR_FORM = {
  selectedSection: 'verbal_reasoning',
  selectedSubtopic: '',
  difficulty: 'medium',
  totalQuestions: 1,
  singleChoiceCount: 1,
  multiChoiceCount: 0,
  passageCount: 0,
  passageMode: 'single_passage', // 'single_passage' | 'independent'
  passageQuestionCount: 2,
  passageSingleCount: 1,
  passageMultiCount: 1,
  independentSingleCount: 2,
  independentMultiCount: 1,
  interactionType: 'single_choice',
  passageRequired: 'No',
  primaryTrap: 'Automatic',
  requireImage: false,
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

  const resetForm = useCallback((overrides = {}) => {
    setFormData({
      ...DEFAULT_GENERATOR_FORM,
      ...overrides
    });
  }, []);

  return {
    formData,
    setFormData,
    updateField,
    updateFields,
    toggleQuestionImage,
    togglePassageImage,
    setImageMode,
    resetForm
  };
}

export default useGeneratorForm;
