// Direct export for lightweight synchronous view
export { default as GeneratorWorkspaceView } from './GeneratorWorkspaceView';

// Heavy views are loaded via React.lazy in App.jsx for optimal bundle chunk splitting:
// - QuestionBankView from './views/QuestionBankView'
// - BatchActivityView from './views/BatchActivityView'
// - AiValidatedQuestionsView from './views/AiValidatedQuestionsView'
export { default as QuestionBankView } from './QuestionBankView';
export { default as BatchActivityView } from './BatchActivityView';
export { default as AiValidatedQuestionsView } from './AiValidatedQuestionsView';
