# TOON (Tokenization-Optimized Object Notation)

Token-efficient data format for LLMs, reducing token consumption by 40-61% compared to JSON.

## Quick Example

**JSON** (verbose):
```json
[
  {"id": 1, "name": "Alice", "balance": 5420.50},
  {"id": 2, "name": "Bob", "balance": 3210.75}
]
```

**TOON** (compact):
```
[2]{id,name,balance}:
1,Alice,5420.50
2,Bob,3210.75
```

**Token savings**: 57% fewer tokens

## When to Use

**Use TOON for:**
- Tabular data (transactions, users, metrics)
- Large datasets consuming many tokens
- Optimizing context window usage
- Data-heavy Claude Code skills/agents

**Don't use for:**
- Deeply nested data (JSON is better)
- Single records (overhead not worth it)
- Non-LLM consumers

## How It Works

1. **Schema hoisting** - Column names declared once, not per row
2. **Minimal syntax** - Uses `,` and `\n` instead of `{}[]"":,`
3. **Type inference** - Auto-detects and coerces types
4. **Streaming** - Process large datasets without loading all into memory

## Integration

### In Skills

```typescript
import { encodeTOON } from '@/claude/utils/toon'

const transactions = await getTransactions()
const toonData = encodeTOON(transactions)
console.log(`Sending ${estimateTokens(toonData)} tokens`)
```

### In Agents

```markdown
# financial-analyst.md

Request data in TOON format to save tokens:

"Please provide transaction data in TOON format"

TOON format:
[count]{columns}:
val1,val2,val3
```

### In Commands

```bash
/export-transactions --format=toon --days=30
```

## Library Location

```
.claude/utils/toon/
├── index.ts          # Main exports
├── encoder.ts        # Encoding logic
├── decoder.ts        # Decoding logic
├── schema.ts         # Schema inference
├── stream.ts         # Streaming support
├── llm.ts            # LLM utilities
├── measure.ts        # Token measurement
└── README.md         # API reference
```

## API Reference

See [`.claude/utils/toon/README.md`](../../utils/toon/README.md) for complete API documentation.

## Testing

```bash
cd .claude/utils/toon
npm test
```

## Token Savings Examples

| Data Type | JSON Tokens | TOON Tokens | Savings |
|-----------|-------------|-------------|---------|
| Financial data | 1,830 | 774 | 58% |
| User records | 2,420 | 950 | 61% |
| API responses | 1,200 | 720 | 40% |

## Performance

- **Encoding**: ~10ms for 1,000 records
- **Decoding**: ~15ms for 1,000 records
- **Streaming**: Handles millions of records
- **Token savings**: Consistent 40-61% reduction

---

**Version**: 1.0.0 (Production Ready)
**License**: MIT
