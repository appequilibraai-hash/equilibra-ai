# Documentação: Correção de Persistência de Data de Nascimento

## Problema Original
A data de nascimento estava mudando quando o usuário salvava ou navegava entre abas. Exemplo:
- Usuário digitava: **21/04/1995**
- Após salvar: mudava para **19/04/1995** (perdia 2 dias)

## Causa Raiz
O campo `birthDate` estava definido como tipo `date` no banco de dados MySQL/Drizzle. Quando uma data é salva como `date`, o banco de dados armazena apenas a data (YYYY-MM-DD) sem informação de horário. Quando o Drizzle retorna essa data, ele a converte para um objeto JavaScript `Date` com horário meia-noite UTC (00:00:00Z).

Isso causava problemas de timezone:
1. Frontend envia: `"1995-04-21T12:00:00Z"` (meio-dia UTC)
2. Backend extrai: `"1995-04-21"` (apenas a data)
3. Banco de dados salva: `1995-04-21` (tipo DATE)
4. Banco retorna: `1995-04-21T00:00:00.000Z` (meia-noite UTC)
5. Frontend converte com UTC: `21/04/1995` ✓ (correto)
6. MAS: Se o frontend converter com timezone local (UTC-3), fica `20/04/1995` ✗ (errado)

## Solução Implementada

### 1. Schema do Banco de Dados (drizzle/schema.ts)
```typescript
// ANTES:
birthDate: date("birthDate"),

// DEPOIS:
birthDate: varchar("birthDate", { length: 10 }), // YYYY-MM-DD format
```

**Benefício**: Armazena a data como string (YYYY-MM-DD) sem conversão automática para Date object, eliminando problemas de timezone.

### 2. Backend - Conversão ao Salvar (server/routers.ts)
```typescript
if (input.birthDate !== undefined) {
  // Extract only the date part (YYYY-MM-DD) to avoid timezone issues
  const date = new Date(input.birthDate);
  updates.birthDate = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}
```

**Fluxo**:
1. Frontend envia: `"1995-04-21T12:00:00Z"`
2. Backend cria Date object: `new Date("1995-04-21T12:00:00Z")`
3. Backend extrai componentes UTC: `getUTCFullYear()`, `getUTCMonth()`, `getUTCDate()`
4. Backend salva como string: `"1995-04-21"`
5. Banco de dados armazena: `"1995-04-21"` (varchar)
6. Banco retorna: `"1995-04-21"` (string, sem conversão)

### 3. Frontend - Conversão ao Exibir (client/src/pages/ProfileSettings.tsx)

#### Função de Formatação (DD/MM/YYYY)
```typescript
const formatDateToBrazilian = (isoDate: string) => {
  if (!isoDate) return "";
  try {
    const date = new Date(isoDate);
    // Use UTC methods to avoid timezone issues
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return "";
  }
};
```

**Fluxo ao carregar**:
1. Backend retorna: `"1995-04-21"`
2. Frontend cria Date: `new Date("1995-04-21")`
3. Frontend extrai UTC: `getUTCDate()` = 21, `getUTCMonth()` = 4, `getUTCFullYear()` = 1995
4. Frontend exibe: `"21/04/1995"` ✓

#### Função de Conversão (DD/MM/YYYY → YYYY-MM-DDTHH:00:00Z)
```typescript
const convertBrazilianToISO = (brazilianDate: string) => {
  if (!brazilianDate) return undefined;
  try {
    const [day, month, year] = brazilianDate.split('/');
    if (!day || !month || !year) return undefined;
    // Add T12:00:00Z to ensure date stays correct across timezones
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00Z`;
  } catch {
    return undefined;
  }
};
```

**Fluxo ao salvar**:
1. Usuário digita: `"21/04/1995"`
2. Frontend converte: `"1995-04-21T12:00:00Z"` (meio-dia UTC)
3. Frontend envia ao backend
4. Backend processa e salva: `"1995-04-21"`
5. Banco retorna: `"1995-04-21"`
6. Frontend exibe: `"21/04/1995"` ✓

## Por que Meio-dia UTC (T12:00:00Z)?

Adicionar `T12:00:00Z` (meio-dia UTC) garante que a data seja interpretada corretamente em qualquer timezone:
- Se o servidor está em UTC+0: 12:00 UTC = 12:00 local
- Se o servidor está em UTC-3 (Brasil): 12:00 UTC = 09:00 local
- Se o servidor está em UTC+9: 12:00 UTC = 21:00 local

Ao usar `getUTCDate()`, `getUTCMonth()`, `getUTCFullYear()`, sempre obtemos a data correta independentemente do timezone local.

## Fluxo Completo de Salvamento

```
Usuário digita: 21/04/1995
        ↓
Frontend: convertBrazilianToISO("21/04/1995")
        ↓
Envia ao backend: "1995-04-21T12:00:00Z"
        ↓
Backend: new Date("1995-04-21T12:00:00Z")
        ↓
Backend: getUTCFullYear() = 1995, getUTCMonth() = 3, getUTCDate() = 21
        ↓
Backend salva: "1995-04-21"
        ↓
Banco de dados: varchar("1995-04-21")
        ↓
Banco retorna: "1995-04-21"
        ↓
Frontend: new Date("1995-04-21")
        ↓
Frontend: getUTCDate() = 21, getUTCMonth() = 4, getUTCFullYear() = 1995
        ↓
Frontend exibe: "21/04/1995" ✓
```

## Testes Realizados

✅ Digitou: 20/05/1992 → Salvou → Exibiu: 20/05/1992  
✅ Digitou: 30/11/1985 → Salvou → Exibiu: 30/11/1985  
✅ Navegou entre abas → Data permaneceu igual  
✅ Recarregou página → Data permaneceu igual  

## Mudanças de Arquivo

| Arquivo | Mudança |
|---------|---------|
| `drizzle/schema.ts` | `date("birthDate")` → `varchar("birthDate", { length: 10 })` |
| `server/routers.ts` | Conversão usando `getUTCFullYear()`, `getUTCMonth()`, `getUTCDate()` |
| `client/src/pages/ProfileSettings.tsx` | `formatDateToBrazilian()` e `convertBrazilianToISO()` com UTC |

## Migration Executada

```sql
ALTER TABLE userProfiles MODIFY COLUMN birthDate VARCHAR(10);
```

## Conclusão

O problema foi completamente resolvido mudando o tipo do campo de `date` para `varchar` e usando métodos UTC consistentemente em todas as conversões. Agora a data que o usuário digita é exatamente a data que é salva e exibida, sem qualquer mudança ou perda de dias.
