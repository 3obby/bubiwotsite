# Token System Audit Trail Migration Instructions

This document outlines the steps needed to update your database schema to support comprehensive audit trails for the token system.

## Overview of Changes

These changes enhance the auditability of the token system by:

1. Adding an `AccrualRecord` model to track token accruals
2. Adding a `TransactionRecord` model for complete transaction history
3. Enhancing the `BurnedCredit` model with balance tracking
4. Adding additional indexes for better query performance

## Migration Steps

### 1. Generate the Migration

Run the following command to create a new migration:

```bash
npm run prisma:migrate:dev -- --name add_token_audit_trail
```

This will:
- Create a new migration file in `prisma/migrations`
- Apply the changes to your development database
- Generate updated Prisma client code

### 2. Review the Migration

The migration will add:
- New tables for `AccrualRecord` and `TransactionRecord`
- New columns to `BurnedCredit`
- New relations and indexes

### 3. Deploy to Production

When ready to deploy to production:

```bash
npm run prisma:migrate:deploy
```

## Using the New Audit Trail Features

### Token Accrual

When a user funds their account from accrued value:
- An `AccrualRecord` is created
- A `TransactionRecord` is created with type 'accrual'
- The global token balance is updated

### Token Usage (Burning)

When a user performs an action that burns credits:
- A `BurnedCredit` record is created with before/after balances
- A `TransactionRecord` is created with type 'burn'
- The global token balance is updated

### Viewing Transaction History

Transaction history can be viewed via the new API endpoint:
```
GET /api/account/transaction-history?userId={userId}&page=1&limit=10
```

## Database Impact

These changes will:
- Increase database storage requirements
- Allow for complete auditability of all token movements
- Enable detailed reporting on token economics

## Data Migration

This is a schema-only migration. No existing data will be affected, though existing records won't have some of the new fields populated. 