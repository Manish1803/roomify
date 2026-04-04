import { useState } from "react";
import { Box, Layers, Globe, Mail, MessageSquare } from "lucide-react";

const GitHubIcon = ({ size = 18 }: { size?: number }) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2.5 5 2.5 5 2.5c-.28 1.15-.28 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
		<path d="M9 18c-4.51 2-5-2-7-2" />
	</svg>
);

const LinkedInIcon = ({ size = 18 }: { size?: number }) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
		<rect width="4" height="12" x="2" y="9" />
		<circle cx="4" cy="4" r="2" />
	</svg>
);

const XIcon = ({ size = 18 }: { size?: number }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="currentColor"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
	</svg>
);

const CheckIcon = ({ size = 16 }: { size?: number }) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="3"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<polyline points="20 6 9 17 4 12" />
	</svg>
);

const Footer = () => {
	const currentYear = new Date().getFullYear();
	const [email, setEmail] = useState("");
	const [isValid, setIsValid] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);

	const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setEmail(value);
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		setIsValid(emailRegex.test(value));
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (isValid) {
			setIsSubmitted(true);
		}
	};

	return (
		<footer className="footer">
			<div className="section-inner">
				<div className="footer-grid">
					<div className="footer-brand">
						<div className="brand">
							<Box className="logo" />
							<span className="name">Roomify</span>
						</div>
						<p className="description">
							Beautiful spaces at the speed of thought. The AI-first design
							environment for modern architects.
						</p>
						<div className="socials">
							<a href="https://github.com/Manish1803/roomify" className="social-link" title="GitHub">
								<GitHubIcon size={18} />
							</a>
							<a href="https://www.linkedin.com/in/manish1803" className="social-link" title="LinkedIn">
								<LinkedInIcon size={18} />
							</a>
							<a href="https://x.com/manish1803_" className="social-link" title="Twitter / X">
								<XIcon size={18} />
							</a>
						</div>
					</div>

					<div className="footer-links">
						<h3>Company</h3>
						<ul>
							<li>
								<a href="#">About</a>
							</li>
							<li>
								<a href="#">Blog</a>
							</li>
							<li>
								<a href="#">Careers</a>
							</li>
							<li>
								<a href="#">Contact</a>
							</li>
						</ul>
					</div>

					<div className="footer-newsletter">
						<h3>Stay Updated</h3>
						<p>
							Get the latest design trends and architectural updates from our
							team.
						</p>
						{isSubmitted ? (
							<div className="submitted-box">
								<CheckIcon size={20} />
								<span>Submitted</span>
							</div>
						) : (
							<form className="newsletter-form" onSubmit={handleSubmit}>
								<input
									type="email"
									placeholder="Enter your email"
									value={email}
									onChange={handleEmailChange}
									className={isValid ? "is-valid" : ""}
									required
								/>
								<button type="submit" className={isValid ? "is-valid" : ""}>
									{isValid ? <CheckIcon /> : "Join"}
								</button>
							</form>
						)}
					</div>
				</div>

				<div className="footer-bottom">
					<p>&copy; {currentYear} Roomify Inc. All rights reserved.</p>
					<div className="bottom-links">
						<a href="#">Privacy</a>
						<a href="#">Terms</a>
						<a href="#">Cookies</a>
					</div>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
