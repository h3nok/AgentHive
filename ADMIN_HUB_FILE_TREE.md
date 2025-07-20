# Admin Hub Vertical Slice - File Tree Proposal

## New Directory Structure

```
packages/
├── ui-kit/                           # NEW: Shared UI components
│   ├── src/
│   │   ├── atoms/
│   │   │   ├── HealthChip/           # NEW: Connector health status
│   │   │   │   ├── HealthChip.tsx
│   │   │   │   ├── HealthChip.stories.tsx
│   │   │   │   └── HealthChip.test.tsx
│   │   │   └── ConnectorIcon/        # NEW: Dynamic connector icons
│   │   │       ├── ConnectorIcon.tsx
│   │   │       ├── ConnectorIcon.stories.tsx
│   │   │       └── ConnectorIcon.test.tsx
│   │   ├── molecules/
│   │   │   ├── GalleryCard/          # NEW: Connector gallery card
│   │   │   │   ├── GalleryCard.tsx
│   │   │   │   ├── GalleryCard.stories.tsx
│   │   │   │   └── GalleryCard.test.tsx
│   │   │   └── JSONSchemaViewer/     # NEW: JSON schema viewer/editor
│   │   │       ├── JSONSchemaViewer.tsx
│   │   │       ├── JSONSchemaViewer.stories.tsx
│   │   │       └── JSONSchemaViewer.test.tsx
│   │   ├── organisms/
│   │   │   └── FixtureRunner/        # NEW: Mock data fixture runner
│   │   │       ├── FixtureRunner.tsx
│   │   │       ├── FixtureRunner.stories.tsx
│   │   │       └── FixtureRunner.test.tsx
│   │   ├── index.ts
│   │   └── package.json
│   ├── .storybook/                   # NEW: Storybook config
│   └── vite.config.ts

frontend/src/
├── features/
│   └── connectors/                   # NEW: Connector management feature
│       ├── api/
│       │   ├── connectorApi.ts       # NEW: TanStack Query API layer
│       │   └── types.ts              # NEW: TypeScript interfaces
│       ├── components/
│       │   ├── ConnectorGallery/     # NEW: Gallery page component
│       │   │   ├── ConnectorGallery.tsx
│       │   │   └── ConnectorGallery.test.tsx
│       │   ├── ConnectorDetail/      # NEW: Detail page component
│       │   │   ├── ConnectorDetail.tsx
│       │   │   └── ConnectorDetail.test.tsx
│       │   └── MockStudio/           # NEW: Mock data studio
│       │       ├── MockStudio.tsx
│       │       └── MockStudio.test.tsx
│       ├── hooks/
│       │   ├── useConnectorList.ts   # NEW: Data fetching hook
│       │   ├── useConnectorDetail.ts # NEW: Detail fetching hook
│       │   └── useFixtureRun.ts      # NEW: Fixture execution hook
│       ├── store/
│       │   └── connectorSlice.ts     # NEW: Zustand slice for auth/state
│       └── index.ts

backend/app/
├── api/v1/
│   └── connectors/                   # NEW: Connector API endpoints
│       ├── __init__.py
│       ├── router.py                 # NEW: FastAPI router
│       ├── schemas.py                # NEW: Pydantic models
│       └── crud.py                   # NEW: Database operations
├── db/models/
│   └── connector.py                  # NEW: SQLModel for connectors
├── fixtures/
│   ├── connectors.json               # NEW: Sample connector data
│   └── mock_responses.json           # NEW: Mock API responses
└── tests/
    └── test_connectors.py            # NEW: API tests

# Updated Files
frontend/src/features/admin/AdminDashboard.tsx  # ADD: New routes
turbo.json                                      # ADD: Dev scripts
.github/workflows/ci.yml                        # UPDATE: Add tests
```

## Route Structure (React Router v6)

```typescript
// In AdminDashboard.tsx
<Routes>
  <Route index element={<DashboardOverview />} />
  <Route path="connectors" element={<ConnectorGallery />} />
  <Route path="connectors/:id" element={<ConnectorDetail />} />
  <Route path="mock-studio" element={<MockStudio />} />
  {/* existing routes... */}
</Routes>
```

## Key Architectural Decisions

1. **Atomic Design**: Components organized by complexity (atoms → molecules → organisms)
2. **Monorepo Structure**: New `packages/ui-kit` for reusable components
3. **Feature-based Organization**: All connector logic in `features/connectors/`
4. **API-first**: Backend endpoints before frontend implementation
5. **Test Coverage**: Unit tests for all business logic, E2E for user flows
6. **Documentation**: JSDoc + Storybook for all UI components

## Dependencies to Add

### Frontend
- `@tanstack/react-query` - Data fetching
- `zustand` - State management
- `react-json-view` - JSON editor for Mock Studio
- `@storybook/react-vite` - Component documentation

### Backend
- `sqlmodel` - Database models
- `alembic` - Database migrations
- `pytest-asyncio` - Async testing
- `httpx` - HTTP client for tests

### Dev/Testing
- `@playwright/test` - E2E testing
- `vitest` - Unit testing
- `@storybook/test` - Component testing
