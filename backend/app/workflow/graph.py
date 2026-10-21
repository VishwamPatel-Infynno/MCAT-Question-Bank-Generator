"""
UK UCAT Multi-Agent LangGraph Workflow.

Assembles and compiles the StateGraph connecting the Fused Generator, Reviewer,
Regenerator, Diagram Generator, Quality Gate Reject, and Finalize nodes.
"""

from langgraph.graph import END, StateGraph

from app.agents.generator import (
    generate_question,
    generate_question_with_self_critique,
)
from app.agents.image_generator import generate_image_stimulus
from app.agents.regenerator import regenerate_question
from app.agents.reviewer import review_question
from app.workflow.engine import (
    WorkflowRunResult,
    run_workflow,
    run_workflow_stream,
)
from app.workflow.nodes import (
    finalize_node,
    fused_generator_node,
    generator_node,
    image_node,
    regenerator_node,
    reject_node,
    reviewer_node,
)
from app.workflow.routes import (
    route_after_fused_generation,
    route_after_review,
)
from app.workflow.state import AgentWorkflowState


def create_ucat_graph() -> StateGraph:
    """Builds and compiles the multi-agent LangGraph workflow with Fused Generator."""
    workflow = StateGraph(AgentWorkflowState)

    # Agent Nodes
    workflow.add_node("fused_generator", fused_generator_node)
    workflow.add_node("generator", generator_node)
    workflow.add_node("reviewer", reviewer_node)
    workflow.add_node("regenerator", regenerator_node)
    workflow.add_node("image_generator", image_node)
    workflow.add_node("finalize", finalize_node)
    workflow.add_node("reject", reject_node)

    # Edges & Conditional Routing
    workflow.set_entry_point("fused_generator")
    workflow.add_conditional_edges(
        "fused_generator",
        route_after_fused_generation,
        {
            "reviewer": "reviewer",
            "image_generator": "image_generator",
            "finalize": "finalize",
        },
    )
    workflow.add_edge("generator", "reviewer")

    workflow.add_conditional_edges(
        "reviewer",
        route_after_review,
        {
            "regenerator": "regenerator",
            "image_generator": "image_generator",
            "finalize": "finalize",
            "reject": "reject",
        },
    )

    workflow.add_edge("regenerator", "reviewer")
    workflow.add_edge("image_generator", "finalize")
    workflow.add_edge("finalize", END)
    workflow.add_edge("reject", END)

    return workflow.compile()


# Global compiled graph singleton
ucat_graph = create_ucat_graph()

__all__ = [
    "AgentWorkflowState",
    "WorkflowRunResult",
    "create_ucat_graph",
    "finalize_node",
    "fused_generator_node",
    "generate_image_stimulus",
    "generate_question",
    "generate_question_with_self_critique",
    "generator_node",
    "image_node",
    "regenerate_question",
    "regenerator_node",
    "reject_node",
    "review_question",
    "reviewer_node",
    "route_after_fused_generation",
    "route_after_review",
    "run_workflow",
    "run_workflow_stream",
    "ucat_graph",
]
