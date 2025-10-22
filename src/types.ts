import type { AuthSession as Session } from '@supabase/supabase-js';

export enum InputType {
    TEXT = 'text',
    IMAGE = 'image',
}
  
export interface UploadedImage {
    base64: string;
    type: string;
}

export interface Bubble {
  id: number;
  text: string;
  x: number; // %
  y: number; // %
  size: number; // % of image width
  rotation: number; // degrees
  scaleX: number; // 1 or -1
  textSize: number; // percentage of bubble width
}

export interface StudioProps {
  session: Session;
  startMode: 'tryon' | 'hairstyle' | 'sceneswap';
  initialImage: UploadedImage | null;
  onNavigateBack: () => void;
  onNavigateToGenerator: () => void;
  onNavigateToSettings: () => void;
  onNavigateToGenerations: () => void;
  onNavigateToVideoGen: (initialImage?: UploadedImage | null) => void;
  imageEditModel: string;
  textGenModel: string;
  videoGenModel: string;
}

export interface MarketingPageProps {
  session: Session;
  initialImage: UploadedImage | null;
  onNavigateBack: () => void;
  onNavigateToSettings: () => void;
  onNavigateToGenerations: () => void;
  handleSignOut: () => void;
  imageEditModel: string;
  onNavigateToGenerator: () => void;
}


export interface Profile {
    username: string | null;
    full_name: string | null;
    gender: string | null;
    birth_date: string | null;
    username_last_changed_at?: string | null;
    user_preferences?: UserPreferences;
    token_balance: number;
    current_package_id: number | null;
    package_expires_at: string | null;
    free_generations_remaining: number;
    bonus_expires_at: string | null;
    storage_limit_bytes: number;
}

export interface ProfileWithId extends Profile {
    id: string;
    updated_at: string;
    available_models_count: number;
}

export interface Generation {
    id: number;
    image_url: string;
    created_at: string;
    prompt: string | null;
    type?: string | null;
    model_used?: string | null;
    api_provider?: string | null;
    settings?: Record<string, any> | null;
    size_bytes?: number;
}

export interface TokenUsage {
    id: number;
    created_at: string;
    model_used: string;
    feature: string;
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
}

export interface UserPreferences {
    playgroundSidebarModes?: any[];
    chatCollapsedCategories?: Record<string, boolean>;
    defaultSearchModel?: string;
    defaultThinkingModel?: string;
    defaultMultimodalModel?: string;
}

export interface SubscriptionPackage {
    id: number;
    name: string;
    price: number;
    tokens_granted: number;
    storage_mb: number;
    description: string;
    enabled_models: string[] | null; // null can mean all models
    created_at: string;
    updated_at: string;
}

// --- Chat Types ---

export interface ModelDefinition {
    id: string;
    name: string;
    category: string;
    logo_url: string;
    tags: string[];
    is_active: boolean;
    is_free_tier: boolean;
    is_accessible: boolean;
}

export type Role = 'user' | 'model';
export type ChatMode = 'normal' | 'search' | 'thinking';

// The Model enum has been replaced with a string type to allow dynamic loading from the database.
export type Model = string;

export interface AttachedImage {
    base64: string;
    type: string;
}

export interface Message {
    id: string;
    role: Role;
    text: string;
    images?: AttachedImage[];
    isLoading?: boolean;
    isError?: boolean;
    sourceModel?: Model | string;
    sentWithMode?: ChatMode;
}

export interface Persona {
    id: string;
    name: string;
    icon: string; // Material Symbols icon name
    systemPrompt: string;
}

export interface Chat {
    id: string;
    title: string;
    messages: Message[];
    models: (Model | string)[];
    systemPrompt?: string;
    createdAt: number;
    updatedAt: number;
    category?: string;
    pinned?: boolean;
    chatMode?: ChatMode;
}