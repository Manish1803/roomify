import { CheckCircle2, ImageIcon, UploadIcon } from "lucide-react";
import { useState, useRef } from "react";
import { useOutletContext } from "react-router";
import {
	PROGRESS_INTERVAL_MS,
	PROGRESS_STEP,
	REDIRECT_DELAY_MS,
} from "../lib/constants";

interface UploadProps {
	onComplete?: (base64Data: string) => void;
}

const Upload = ({ onComplete }: UploadProps) => {
	const [file, setFile] = useState<File | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [progress, setProgress] = useState(0);
	const inputRef = useRef<HTMLInputElement>(null);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);

	const { isSignedIn } = useOutletContext<AuthContext>();

	const processFile = (selectedFile: File) => {
		if (!isSignedIn) return;

		setFile(selectedFile);
		setProgress(0);

		const reader = new FileReader();

		reader.onload = (e) => {
			const base64String = e.target?.result as string;

			// Start progress increment
			intervalRef.current = setInterval(() => {
				setProgress((prev) => {
					const newProgress = prev + PROGRESS_STEP;
					if (newProgress >= 100) {
						if (intervalRef.current) {
							clearInterval(intervalRef.current);
						}

						// Call onComplete after redirect delay
						setTimeout(() => {
							if (onComplete) {
								onComplete(base64String);
							}
						}, REDIRECT_DELAY_MS);

						return 100;
					}
					return newProgress;
				});
			}, PROGRESS_INTERVAL_MS);
		};

		reader.readAsDataURL(selectedFile);
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0];
		if (selectedFile && isSignedIn) {
			processFile(selectedFile);
		}
	};

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		if (isSignedIn) {
			setIsDragging(true);
		}
	};

	const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragging(false);
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragging(false);

		if (!isSignedIn) return;

		const droppedFile = e.dataTransfer.files?.[0];
		if (droppedFile && droppedFile.type.startsWith("image/")) {
			processFile(droppedFile);
		}
	};

	return (
		<div className="upload">
			{!file ? (
				<div
					className={`dropzone ${isDragging ? "is-dragging" : ""}`}
					onDragOver={handleDragOver}
					onDragLeave={handleDragLeave}
					onDrop={handleDrop}
				>
					<input
						ref={inputRef}
						type="file"
						className="drop-input"
						accept=".jpg, .jpeg, .png"
						disabled={!isSignedIn}
						onChange={handleFileChange}
					/>

					<div className="drop-content">
						<div className="drop-icon">
							<UploadIcon size={20} />
						</div>
						<p>
							{isSignedIn
								? "Click to upload or just drag and drop"
								: "Please sign in or sign up with Puter to upload files"}
						</p>
						<p className="help">Maximum file size 50 MB.</p>
					</div>
				</div>
			) : (
				<div className="upload-status">
					<div className="status-content">
						<div className="status-icon">
							{progress === 100 ? (
								<CheckCircle2 className="check" />
							) : (
								<ImageIcon className="image" />
							)}
						</div>

						<h3>{file.name}</h3>

						<div className="progress">
							<div className="bar" style={{ width: `${progress}%` }} />

							<p className="status-text">
								{progress < 100 ? "Analysing Floor Plan..." : "Redirecting ..."}
							</p>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default Upload;
