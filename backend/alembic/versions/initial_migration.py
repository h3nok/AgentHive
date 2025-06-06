"""Initial migration.

Revision ID: 001
Revises: 
Create Date: 2024-03-19 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enum types
    op.execute("CREATE TYPE agent_type AS ENUM ('router', 'llm', 'tool')")
    op.execute("CREATE TYPE message_role AS ENUM ('system', 'user', 'assistant', 'tool')")
    
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('full_name', sa.String()),
        sa.Column('role', sa.String(), default='user'),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(), default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), default=sa.func.now(), onupdate=sa.func.now()),
        sa.UniqueConstraint('email')
    )
    op.create_index('ix_users_email', 'users', ['email'])
    
    # Create sessions table
    op.create_table(
        'sessions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id')),
        sa.Column('created_at', sa.DateTime(), default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), default=sa.func.now(), onupdate=sa.func.now()),
        sa.Column('metadata', postgresql.JSON(), default=dict)
    )
    
    # Create messages table
    op.create_table(
        'messages',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('sessions.id')),
        sa.Column('role', sa.Enum('system', 'user', 'assistant', 'tool', name='message_role'), nullable=False),
        sa.Column('content', sa.String(), nullable=False),
        sa.Column('metadata', postgresql.JSON(), default=dict),
        sa.Column('created_at', sa.DateTime(), default=sa.func.now())
    )
    
    # Create agents table
    op.create_table(
        'agents',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('agent_type', sa.Enum('router', 'llm', 'tool', name='agent_type'), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String()),
        sa.Column('version', sa.String(), nullable=False),
        sa.Column('enabled', sa.Boolean(), default=True),
        sa.Column('load_order', sa.Integer(), default=0),
        sa.Column('capabilities', postgresql.ARRAY(sa.String()), default=list),
        sa.Column('config', postgresql.JSON(), default=dict),
        sa.Column('created_at', sa.DateTime(), default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # Create request_metrics table
    op.create_table(
        'request_metrics',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('request_id', sa.String(), unique=True),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('sessions.id')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id')),
        sa.Column('agent_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('agents.id')),
        sa.Column('success', sa.Boolean(), default=True),
        sa.Column('error', sa.String()),
        sa.Column('token_usage', postgresql.JSON()),
        sa.Column('latency', postgresql.JSON()),
        sa.Column('created_at', sa.DateTime(), default=sa.func.now())
    )
    op.create_index('ix_request_metrics_request_id', 'request_metrics', ['request_id'])
    
    # Create rate_limits table
    op.create_table(
        'rate_limits',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('key', sa.String(), unique=True),
        sa.Column('requests', sa.Integer(), default=0),
        sa.Column('window_start', sa.DateTime(), default=sa.func.now()),
        sa.Column('window_end', sa.DateTime()),
        sa.Column('created_at', sa.DateTime(), default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), default=sa.func.now(), onupdate=sa.func.now())
    )
    op.create_index('ix_rate_limits_key', 'rate_limits', ['key'])


def downgrade() -> None:
    # Drop tables
    op.drop_table('rate_limits')
    op.drop_table('request_metrics')
    op.drop_table('agents')
    op.drop_table('messages')
    op.drop_table('sessions')
    op.drop_table('users')
    
    # Drop enum types
    op.execute('DROP TYPE message_role')
    op.execute('DROP TYPE agent_type') 