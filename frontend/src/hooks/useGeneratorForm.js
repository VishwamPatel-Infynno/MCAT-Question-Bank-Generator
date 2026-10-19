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
    resetForm
  };
}

export default useGeneratorForm;
