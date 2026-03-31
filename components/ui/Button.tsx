import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "primary" | "secondary" | "ghost" | "outline";
	size?: "sm" | "md" | "lg";
	fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			variant = "primary",
			size = "md",
			fullWidth = false,
			className = "",
			children,
			...props
		},
		ref,
	) => {
		const classes = [
			"btn",
			`btn--${variant}`,
			`btn--${size}`,
			...(fullWidth ? ["btn--fullWidth"] : []),
			className,
		]
			.filter(Boolean)
			.join(" ");

		return (
			<button ref={ref} className={classes} {...props}>
				{children}
			</button>
		);
	},
);

Button.displayName = "Button";

export default Button;
