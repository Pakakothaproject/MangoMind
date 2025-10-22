import { ChatMode } from '../types';
import { useAppStore } from '../store/appStore';
import { getAvailableModels } from './configService';

export interface ModelSelectionContext {
    chatMode: ChatMode;
    hasImages: boolean;
    hasDocuments: boolean;
    messageText: string;
    conversationHistory?: any[];
}

export interface SmartModelResult {
    modelId: string;
    reason: string;
    fallbackToRouter: boolean;
}

/**
 * Smart model selection service that chooses the best model based on context
 */
export class SmartModelSelection {
    private static instance: SmartModelSelection;
    
    static getInstance(): SmartModelSelection {
        if (!SmartModelSelection.instance) {
            SmartModelSelection.instance = new SmartModelSelection();
        }
        return SmartModelSelection.instance;
    }

    /**
     * Select the best model based on the given context
     */
    async selectModel(context: ModelSelectionContext): Promise<SmartModelResult> {
        const { 
            defaultSearchModel, 
            defaultThinkingModel, 
            defaultMultimodalModel 
        } = useAppStore.getState();

        // Priority 1: Multimodal content (images/documents)
        if (context.hasImages || context.hasDocuments) {
            if (defaultMultimodalModel) {
                return {
                    modelId: defaultMultimodalModel,
                    reason: 'Selected multimodal model due to image/document content',
                    fallbackToRouter: false
                };
            }
            // Fallback to router for multimodal if no default set
            return {
                modelId: '',
                reason: 'No default multimodal model set, using router',
                fallbackToRouter: true
            };
        }

        // Priority 2: Explicit chat mode selection
        switch (context.chatMode) {
            case 'search':
                if (defaultSearchModel) {
                    return {
                        modelId: defaultSearchModel,
                        reason: 'Selected search model due to search mode',
                        fallbackToRouter: false
                    };
                }
                break;
                
            case 'thinking':
                if (defaultThinkingModel) {
                    return {
                        modelId: defaultThinkingModel,
                        reason: 'Selected thinking model due to thinking mode',
                        fallbackToRouter: false
                    };
                }
                break;
        }

        // Priority 3: Content-based inference for normal mode
        if (context.chatMode === 'normal') {
            const inferredCapability = this.inferRequiredCapability(context.messageText);
            
            switch (inferredCapability) {
                case 'search':
                    if (defaultSearchModel) {
                        return {
                            modelId: defaultSearchModel,
                            reason: 'Inferred search capability needed from message content',
                            fallbackToRouter: false
                        };
                    }
                    break;
                    
                case 'thinking':
                    if (defaultThinkingModel) {
                        return {
                            modelId: defaultThinkingModel,
                            reason: 'Inferred reasoning/thinking capability needed from message content',
                            fallbackToRouter: false
                        };
                    }
                    break;
            }
        }

        // Priority 4: Fallback to AI router for complex decisions
        return {
            modelId: '',
            reason: 'Using AI router for complex model selection',
            fallbackToRouter: true
        };
    }

    /**
     * Infer required capability from message text
     */
    private inferRequiredCapability(messageText: string): 'search' | 'thinking' | 'general' {
        const lowerText = messageText.toLowerCase();
        
        // Search indicators
        const searchKeywords = [
            'search', 'find', 'lookup', 'what is', 'who is', 'when did', 'where is',
            'current', 'latest', 'recent', 'news', 'today', 'now', 'real-time',
            'weather', 'stock', 'price', 'market', 'trending'
        ];
        
        // Thinking/reasoning indicators
        const thinkingKeywords = [
            'analyze', 'reasoning', 'logic', 'think', 'consider', 'evaluate',
            'compare', 'pros and cons', 'step by step', 'break down', 'explain why',
            'complex', 'difficult', 'challenging', 'solve', 'problem', 'strategy',
            'plan', 'approach', 'methodology', 'algorithm'
        ];

        const hasSearchKeywords = searchKeywords.some(keyword => lowerText.includes(keyword));
        const hasThinkingKeywords = thinkingKeywords.some(keyword => lowerText.includes(keyword));

        // If both are present, prioritize thinking for complex analysis
        if (hasThinkingKeywords) {
            return 'thinking';
        }
        
        if (hasSearchKeywords) {
            return 'search';
        }

        return 'general';
    }

    /**
     * Validate that a model is available and accessible
     */
    async validateModel(modelId: string): Promise<boolean> {
        try {
            const availableModels = await getAvailableModels();
            return availableModels.some(model => model.id === modelId);
        } catch (error) {
            console.error('Error validating model:', error);
            return false;
        }
    }

    /**
     * Get fallback model for a given capability
     */
    async getFallbackModel(capability: 'search' | 'thinking' | 'multimodal'): Promise<string | null> {
        try {
            const availableModels = await getAvailableModels();
            
            switch (capability) {
                case 'search':
                    const searchModel = availableModels.find(m => m.tags.includes('Search'));
                    return searchModel?.id as string || null;
                    
                case 'thinking':
                    const thinkingModel = availableModels.find(m => 
                        m.tags.some(tag => ['Reasoning', 'thinking', 'reasoning'].includes(tag))
                    );
                    return thinkingModel?.id as string || null;
                    
                case 'multimodal':
                    const multimodalModel = availableModels.find(m => m.tags.includes('Multimodal'));
                    return multimodalModel?.id as string || null;
                    
                default:
                    return null;
            }
        } catch (error) {
            console.error('Error getting fallback model:', error);
            return null;
        }
    }
}

// Export singleton instance
export const smartModelSelection = SmartModelSelection.getInstance();