import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const AI_MODEL = 'claude-sonnet-4-6' as const
export const AI_MAX_TOKENS = 1024
export const AI_MAX_TOKENS_BRIEF = 2048
