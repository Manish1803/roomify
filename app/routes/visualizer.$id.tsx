import { useEffect, useRef, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router";
import {
	ReactCompareSlider,
	ReactCompareSliderImage,
} from "react-compare-slider";
import { Box, Download, RefreshCcw, Share2, Trash2, X } from "lucide-react";

import Button from "../../components/ui/Button";
import { generate3DView } from "../../lib/ai.action";
import {
	createProject,
	getProjectById,
	shareProject,
	unshareProject,
	deleteProject,
} from "../../lib/puter.action";

const VisualizerId = () => {
	const { id } = useParams();
	const navigate = useNavigate();

	const hasInitialGenerated = useRef(false);

	const [project, setProject] = useState<DesignItem | null>(null);
	const [isProjectLoading, setIsProjectLoading] = useState(true);

	const [isProcessing, setIsProcessing] = useState(false);
	const [isSharing, setIsSharing] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [currentImage, setCurrentImage] = useState<string | null>(null);

	const { userName, userId } = useOutletContext<AuthContext>();

	const handleBack = () => navigate(-1);
	const handleExport = () => {
		if (!currentImage) return;

		const link = document.createElement("a");
		link.href = currentImage;
		link.download = `roomify-${id || "design"}.png`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const handleShare = async () => {
		if (!project || !id) return;

		try {
			setIsSharing(true);
			if (project.isPublic) {
				const updated = await unshareProject({ id });
				if (updated) setProject(updated);
			} else {
				const metadata = {
					sharedBy: userName || "Anonymous User",
					ownerId: userId,
				};
				const updated = await shareProject({ id, metadata });
				if (updated) setProject(updated);
			}
		} catch (error) {
			console.error("Failed to toggle share status:", error);
		} finally {
			setIsSharing(false);
		}
	};

	const handleDelete = async () => {
		if (!project || !id) return;

		const confirmed = window.confirm(
			"Are you sure you want to delete this project? This action cannot be undone.",
		);
		if (!confirmed) return;

		try {
			setIsDeleting(true);
			const success = await deleteProject({ id });
			if (success) {
				navigate("/");
			} else {
				alert("Failed to delete project. Please try again.");
			}
		} catch (error) {
			console.error("Failed to delete project:", error);
			alert("An error occurred while deleting the project.");
		} finally {
			setIsDeleting(false);
		}
	};

	const runGeneration = async (item: DesignItem) => {
		if (!id || !item.sourceImage) return;

		try {
			setIsProcessing(true);
			const result = await generate3DView({ sourceImage: item.sourceImage });
			if (result.renderedImage) {
				setCurrentImage(result.renderedImage);

				const updatedItem = {
					...item,
					renderedImage: result.renderedImage,
					renderedPath: result.renderedPath,
					timestamp: Date.now(),
					ownerId: item.ownerId ?? userId ?? null,
					isPublic: item.isPublic ?? false,
				};

				const saved = await createProject({
					item: updatedItem,
					visibility: "private",
				});

				if (saved) {
					setProject(saved);
					setCurrentImage(saved.renderedImage || result.renderedImage);
				}
			}
		} catch (error) {
			console.error("Generation failed:", error);
		} finally {
			setIsProcessing(false);
		}
	};

	useEffect(() => {
		let isMounted = true;

		const loadProject = async () => {
			if (!id) {
				setIsProjectLoading(false);
				return;
			}

			setIsProjectLoading(true);

			const fetchedProject = await getProjectById({ id });

			if (!isMounted) return;

			setProject(fetchedProject);
			setCurrentImage(fetchedProject?.renderedImage || null);
			setIsProjectLoading(false);
			hasInitialGenerated.current = false;
		};

		loadProject();

		return () => {
			isMounted = false;
		};
	}, [id]);

	useEffect(() => {
		if (
			isProjectLoading ||
			hasInitialGenerated.current ||
			!project?.sourceImage
		)
			return;

		if (project.renderedImage) {
			setCurrentImage(project.renderedImage);
			hasInitialGenerated.current = true;
			return;
		}

		hasInitialGenerated.current = true;
		void runGeneration(project);
	}, [project, isProjectLoading]);

	return (
		<div className="visualizer">
			<nav className="topbar">
				<div className="brand">
					<Box className="logo" />
					<span className="name">Roomify</span>
				</div>

				<Button variant="ghost" size="sm" onClick={handleBack} className="exit">
					<X className="icon" /> Exit Editor
				</Button>
			</nav>

			<section className="content">
				<div className="panel">
					<div className="panel-header">
						<div className="panel-meta">
							<p>Project</p>
							<h2>{project?.name || `Residence ${id}`}</h2>
							<p className="note">
								By {project?.sharedBy || (project?.ownerId === userId ? "You" : "Unknown")}
							</p>
						</div>

						<div className="panel-actions">
							<Button
								size="sm"
								onClick={handleExport}
								className="export"
								disabled={!currentImage}
							>
								<Download className="w-4 h-4 mr-2" /> Export
							</Button>
							{project?.isPublic && project?.ownerId !== userId ? (
								<Button size="sm" className="share is-active" disabled>
									<span className="pulse-dot mr-2" /> Community Project
								</Button>
							) : (
								<Button
									size="sm"
									onClick={handleShare}
									className={`share ${project?.isPublic ? "is-active" : ""}`}
									disabled={isSharing || isDeleting || !currentImage}
								>
									<Share2 className="w-4 h-4 mr-2" />
									{isSharing ? (
										"Processing..."
									) : project?.isPublic ? (
										<>
											<span className="pulse-dot mr-2" /> Unshare
										</>
									) : (
										"Share"
									)}
								</Button>
							)}

							{project?.ownerId === userId && (
								<Button
									size="sm"
									variant="ghost"
									onClick={handleDelete}
									className="text-red-500 hover:text-red-600 hover:bg-red-50"
									disabled={isDeleting || isSharing}
								>
									<Trash2 className="w-4 h-4 mr-2" />
									{isDeleting ? "Deleting..." : "Delete"}
								</Button>
							)}
						</div>
					</div>

					<div className={`render-area ${isProcessing ? "is-processing" : ""}`}>
						{currentImage ? (
							<img src={currentImage} alt="AI Render" className="render-img" />
						) : (
							<div className="render-placeholder">
								{project?.sourceImage && (
									<img
										src={project?.sourceImage}
										alt="Original"
										className="render-fallback"
									/>
								)}
							</div>
						)}

						{isProcessing && (
							<div className="render-overlay">
								<div className="rendering-card">
									<RefreshCcw className="spinner" />
									<span className="title">Rendering...</span>
									<span className="subtitle">
										Generating your 3D Visualization
									</span>
								</div>
							</div>
						)}
					</div>
				</div>

				<div className="panel compare">
					<div className="panel-header">
						<div className="panel-meta">
							<p>Comparsion</p>
							<h3>Before and After</h3>
						</div>
						<div className="hint">Drag to compare.</div>
					</div>

					<div className="compare-stage">
						{project?.sourceImage && currentImage ? (
							<ReactCompareSlider
								defaultValue={50}
								style={{ width: "100%", height: "100%" }}
								itemOne={
									<ReactCompareSliderImage
										src={project?.sourceImage}
										alt="before"
										style={{ objectFit: "contain", width: "100%", height: "100%" }}
									/>
								}
								itemTwo={
									<ReactCompareSliderImage
										src={project?.renderedImage || currentImage}
										alt="after"
										style={{ objectFit: "contain", width: "100%", height: "100%" }}
									/>
								}
							/>
						) : (
							<div className="compare-fallback">
								{project?.sourceImage && (
									<img
										src={project?.sourceImage}
										alt="Before"
										className="compare-img"
									/>
								)}
							</div>
						)}
					</div>
				</div>
			</section>
		</div>
	);
};

export default VisualizerId;
