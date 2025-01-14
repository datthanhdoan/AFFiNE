-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "ai_contexts" (
    "id" VARCHAR NOT NULL,
    "workspace_id" VARCHAR NOT NULL,
    "config" JSON NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ai_contexts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_context_embeddings" (
    "id" VARCHAR NOT NULL,
    "context_id" VARCHAR NOT NULL,
    "file_id" VARCHAR NOT NULL,
    "chunk" INTEGER NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ai_context_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_workspace_embeddings" (
    "workspace_id" VARCHAR NOT NULL,
    "doc_id" VARCHAR NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ai_workspace_embeddings_pkey" PRIMARY KEY ("workspace_id","doc_id")
);

-- AddForeignKey
ALTER TABLE "ai_context_embeddings" ADD CONSTRAINT "ai_context_embeddings_context_id_fkey" FOREIGN KEY ("context_id") REFERENCES "ai_contexts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_workspace_embeddings" ADD CONSTRAINT "ai_workspace_embeddings_workspace_id_doc_id_fkey" FOREIGN KEY ("workspace_id", "doc_id") REFERENCES "snapshots"("workspace_id", "guid") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX IF NOT EXISTS ai_context_embeddings_idx ON ai_context_embeddings USING hnsw (embedding vector_cosine_ops);

-- CreateIndex
CREATE INDEX IF NOT EXISTS ai_workspace_embeddings_idx ON ai_workspace_embeddings USING hnsw (embedding vector_cosine_ops);