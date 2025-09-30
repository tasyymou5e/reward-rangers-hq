# AI Integration Documentation

## Overview

Chatterbox includes AI-powered features using the Lovable AI Gateway, providing intelligent assistance for family chore management.

## AI Assistant

### Features
- **Conversational Interface**: Natural language interaction
- **Streaming Responses**: Real-time token-by-token output
- **Context-Aware**: Understands family chore management context
- **Multi-Purpose**: Chore suggestions, motivation tips, progress analysis

### Technical Implementation

#### Backend: Edge Function
**Location**: `supabase/functions/ai-assistant/index.ts`

```typescript
// Key features:
- Model: google/gemini-2.5-flash (free during promo period)
- Streaming: SSE (Server-Sent Events)
- CORS: Enabled for web app access
- Rate limiting: Built-in error handling
- Security: JWT authentication required
```

#### Frontend: React Component
**Location**: `src/components/AIAssistant.tsx`

```typescript
// Features:
- Real-time streaming display
- Message history management
- Error handling with user feedback
- Keyboard shortcuts (Enter to send)
- Mobile-responsive design
```

### Integration Points

#### Parents Portal
- **Tab**: "AI Assistant" in main navigation
- **Usage**: Get chore suggestions, family management tips
- **Access**: Available to all authenticated parents

### System Prompt

```
You are a helpful AI assistant for Chatterbox, a family chore management app. 
You help families with:
- Creating and organizing chores
- Suggesting age-appropriate tasks for children
- Providing motivational tips for completing chores
- Analyzing family progress and patterns
- Offering advice on reward systems and gamification

Be friendly, encouraging, and family-focused. Keep responses concise and actionable.
```

## API Configuration

### Lovable AI Gateway
- **URL**: `https://ai.gateway.lovable.dev/v1/chat/completions`
- **Authentication**: `LOVABLE_API_KEY` (auto-configured)
- **Model**: `google/gemini-2.5-flash`
- **Free Period**: Sept 29 - Oct 6, 2025

### Rate Limits
- **429 Error**: Rate limit exceeded - retry after delay
- **402 Error**: Payment required - credits exhausted
- **Handling**: User-friendly error messages with retry guidance

### Error Handling

```typescript
// Client-side error handling
if (response.status === 429) {
  toast.error("Rate limit exceeded. Please try again in a moment.");
}
if (response.status === 402) {
  toast.error("AI service requires payment. Please contact support.");
}
```

## Usage Examples

### Example Conversations

**Chore Suggestions**:
```
User: "Suggest chores for a 10-year-old"
AI: "Great question! Here are age-appropriate chores for a 10-year-old:
1. Making their bed daily
2. Loading/unloading dishwasher
3. Taking out trash
4. Vacuuming their room
5. Helping with meal prep (supervised)

Would you like me to suggest point values for these?"
```

**Motivation Tips**:
```
User: "How can I motivate my kids to complete chores?"
AI: "Here are proven strategies:
1. Use the points system - set achievable goals
2. Create friendly competition with siblings
3. Celebrate streak milestones
4. Let them choose their rewards
5. Make chores fun with music or timers"
```

## Performance Optimization

### Streaming Implementation
- **Token-by-token**: Real-time display as AI generates
- **Buffer management**: Efficient handling of partial JSON
- **Memory**: Lightweight message history

### Caching Strategy
- Messages stored in component state
- No server-side persistence (privacy-focused)
- Session-based history

## Security

### Authentication
- JWT verification required
- Edge function validates tokens
- Rate limiting per user/IP

### Data Privacy
- No message persistence
- Ephemeral conversations
- No PII shared with AI service

### API Key Security
- Server-side only (`LOVABLE_API_KEY`)
- Never exposed to client
- Automatic rotation supported

## Future Enhancements

### Planned Features
1. **Behavioral Analysis**: AI-powered insights from family patterns
2. **Smart Scheduling**: Optimal chore timing recommendations
3. **Conflict Resolution**: Family negotiation assistance
4. **Progress Predictions**: Achievement forecasting
5. **Personalized Tips**: Individual child-specific advice

### Technical Roadmap
- [ ] Function calling for structured data
- [ ] Multi-turn conversation memory
- [ ] Integration with analytics system
- [ ] Voice input support
- [ ] Multi-language support

## Configuration

### Edge Function Setup
```toml
# supabase/config.toml
[functions.ai-assistant]
verify_jwt = true
```

### Environment Variables
```
LOVABLE_API_KEY (auto-configured)
```

### Deployment
- Automatic deployment with code changes
- No manual configuration required
- Secrets managed by Supabase

## Monitoring

### Key Metrics
- Response time: <3s average
- Error rate: <1%
- User satisfaction: Track via feedback
- Token usage: Monitor costs

### Logs Location
- Supabase Dashboard → Functions → ai-assistant → Logs
- Real-time streaming logs
- Error tracking with context

## Troubleshooting

### Common Issues

**Slow Responses**
- Check network connectivity
- Verify model selection (use flash not pro)
- Monitor Lovable AI service status

**Rate Limiting**
- Implement exponential backoff
- Show user-friendly messages
- Consider response caching

**Authentication Errors**
- Verify JWT token validity
- Check user session status
- Validate Supabase configuration

## Cost Management

### Free Tier
- Free Gemini models: Sept 29 - Oct 6, 2025
- Generous free tier after promo
- Pay-as-you-go pricing

### Optimization
- Use streaming to show progress
- Cache common responses
- Implement smart retry logic

## Developer Guide

### Adding New AI Features

1. **Create Edge Function**
```typescript
// supabase/functions/new-feature/index.ts
const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "google/gemini-2.5-flash",
    messages: [
      { role: "system", content: "Your system prompt" },
      ...messages
    ],
    stream: true
  })
});
```

2. **Create React Component**
```typescript
// src/components/NewAIFeature.tsx
const [messages, setMessages] = useState<Message[]>([]);
const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/new-feature`,
  // ... implementation
);
```

3. **Update Configuration**
```toml
[functions.new-feature]
verify_jwt = true
```

## Support

### Resources
- [Lovable AI Docs](https://docs.lovable.dev/features/ai)
- [Gemini Model Info](https://ai.google.dev/models/gemini)
- [Supabase Functions](https://supabase.com/docs/guides/functions)

### Contact
- Issues: Project GitHub repository
- Questions: Development team
- Urgent: System administrators

---

**Last Updated**: January 9, 2025
**Version**: 1.0
**Integration Status**: ✅ Production Ready
