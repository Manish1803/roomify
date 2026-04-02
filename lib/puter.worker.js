const PROJECT_PREFIX = "roomify_project_";
const PUBLIC_PROJECT_PREFIX = "roomify_public_";

const jsonError = (status, message, extra = {}) => {
	return new Response(JSON.stringify({ error: message, ...extra }), {
		status,
		headers: {
			"Content-Type": "application/json",
			"Access-Control-Allow-Origin": "*",
		},
	});
};

const getUserId = async (userPuter) => {
	try {
		const user = await userPuter.auth.getUser();

		return user?.uuid || null;
	} catch {
		return null;
	}
};

// Helper to get the context safely
const getCtx = (args) => {
	const { request, user, params } = args;
	// me is reported to be global, but let's check if it's also in args
	const meContext = args.me || (typeof me !== 'undefined' ? me : null);
	
	return {
		request,
		user,
		me: meContext,
		userPuter: user?.puter,
		mePuter: meContext?.puter
	};
};

router.post("/api/projects/save", async (ctxArgs) => {
	const { request, user, userPuter } = getCtx(ctxArgs);
	try {
		if (!userPuter) return jsonError(401, "Authentication failed: 'user.puter' is missing", { available_keys: Object.keys(ctxArgs) });

		const body = await request.json();
		const project = body?.project;

		if (!project?.id || !project?.sourceImage)
			return jsonError(400, "Project ID and source image are required");

		const payload = {
			...project,
			updatedAt: new Date().toISOString(),
		};

		const userId = await getUserId(userPuter);
		if (!userId) return jsonError(401, "Authentication failed: Could not retrieve user ID");

		const key = `${PROJECT_PREFIX}${project.id}`;
		await userPuter.kv.set(key, payload);

		return { saved: true, id: project.id, project: payload };
	} catch (e) {
		return jsonError(500, "Failed to save project", {
			message: e.message || "Unknown error",
			stack: e.stack
		});
	}
});

router.get("/api/projects/list", async (ctxArgs) => {
	const { user, me, userPuter, mePuter } = getCtx(ctxArgs);
	try {
		if (!userPuter) return jsonError(401, "Authentication failed: 'user.puter' is missing", { available_keys: Object.keys(ctxArgs) });
		if (!mePuter?.kv) return jsonError(500, "Worker configuration error: 'me.puter.kv' is missing", { me_exists: !!me, me_puter_exists: !!mePuter });

		const userId = await getUserId(userPuter);
		if (!userId) return jsonError(401, "Authentication failed: Could not retrieve user ID");

		// Get private projects
		const privateProjects = (await userPuter.kv.list(PROJECT_PREFIX, true)).map(
			({ value }) => ({ ...value, isPublic: false }),
		);

		// Get public projects shared by this user (all public projects now)
		const allPublicProjects = (await mePuter.kv.list(PUBLIC_PROJECT_PREFIX, true)).map(
			({ value }) => ({ ...value, isPublic: true }),
		);

		return { projects: [...privateProjects, ...allPublicProjects] };
	} catch (e) {
		return jsonError(500, "Failed to list projects", {
			message: e.message || "Unknown error",
			stack: e.stack
		});
	}
});

router.get("/api/projects/get", async (ctxArgs) => {
	const { request, userPuter, mePuter } = getCtx(ctxArgs);
	try {
		const url = new URL(request.url);
		const id = url.searchParams.get("id");

		if (!id) return jsonError(400, "Project ID is required");

		// Check private first
		if (userPuter) {
			const privateKey = `${PROJECT_PREFIX}${id}`;
			const privateProject = await userPuter.kv.get(privateKey);
			if (privateProject) {
				return { project: { ...privateProject, isPublic: false } };
			}
		}

		// Check public
		const publicKey = `${PUBLIC_PROJECT_PREFIX}${id}`;
		if (!mePuter?.kv) return jsonError(500, "Worker configuration error: 'me.puter.kv' is missing");
		const publicProject = await mePuter.kv.get(publicKey);
		if (publicProject) {
			return { project: { ...publicProject, isPublic: true } };
		}

		return jsonError(404, "Project not found");
	} catch (e) {
		return jsonError(500, "Failed to get project", {
			message: e.message || "Unknown error",
			stack: e.stack
		});
	}
});

router.post("/api/projects/share", async (ctxArgs) => {
	const { request, userPuter, mePuter } = getCtx(ctxArgs);
	try {
		if (!userPuter) return jsonError(401, "Authentication failed: 'user.puter' is missing");

		const body = await request.json();
		const { id, metadata } = body;

		if (!id) return jsonError(400, "Project ID is required");

		const privateKey = `${PROJECT_PREFIX}${id}`;
		const project = await userPuter.kv.get(privateKey);

		if (!project) return jsonError(404, "Project not found in private storage");

		// Remove from private
		await userPuter.kv.del(privateKey);

		const userId = await getUserId(userPuter);

		// Add to public
		const publicPayload = {
			...project,
			...metadata,
			ownerId: userId,
			isPublic: true,
			sharedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		const publicKey = `${PUBLIC_PROJECT_PREFIX}${id}`;
		if (!mePuter?.kv) return jsonError(500, "Worker configuration error: 'me.puter.kv' is missing");
		await mePuter.kv.set(publicKey, publicPayload);

		return { shared: true, project: publicPayload };
	} catch (e) {
		return jsonError(500, "Failed to share project", {
			message: e.message || "Unknown error",
			stack: e.stack
		});
	}
});

router.post("/api/projects/unshare", async (ctxArgs) => {
	const { request, userPuter, mePuter } = getCtx(ctxArgs);
	try {
		if (!userPuter) return jsonError(401, "Authentication failed: 'user.puter' is missing");

		const body = await request.json();
		const { id } = body;

		if (!id) return jsonError(400, "Project ID is required");

		const publicKey = `${PUBLIC_PROJECT_PREFIX}${id}`;
		if (!mePuter?.kv) return jsonError(500, "Worker configuration error: 'me.puter.kv' is missing");
		const project = await mePuter.kv.get(publicKey);

		if (!project) return jsonError(404, "Project not found in public storage");

		const userId = await getUserId(userPuter);
		if (project.ownerId !== userId) {
			return jsonError(403, "Not authorized to unshare this project");
		}

		// Remove from public
		await mePuter.kv.del(publicKey);

		// Add back to private
		const privatePayload = {
			...project,
			isPublic: false,
			updatedAt: new Date().toISOString(),
		};
		// Clean up metadata? 
		delete privatePayload.sharedBy;
		delete privatePayload.sharedAt;

		const privateKey = `${PROJECT_PREFIX}${id}`;
		await userPuter.kv.set(privateKey, privatePayload);

		return { unshared: true, project: privatePayload };
	} catch (e) {
		return jsonError(500, "Failed to unshare project", {
			message: e.message || "Unknown error",
			stack: e.stack
		});
	}
});

router.post("/api/projects/delete", async (ctxArgs) => {
	const { request, userPuter, mePuter } = getCtx(ctxArgs);
	try {
		if (!userPuter) return jsonError(401, "Authentication failed: 'user.puter' is missing");

		const body = await request.json();
		const { id } = body;

		if (!id) return jsonError(400, "Project ID is required");

		const userId = await getUserId(userPuter);

		// 1. Delete from private storage
		const privateKey = `${PROJECT_PREFIX}${id}`;
		await userPuter.kv.del(privateKey);

		// 2. Delete from public storage (only if owner)
		if (mePuter?.kv) {
			const publicKey = `${PUBLIC_PROJECT_PREFIX}${id}`;
			const publicProject = await mePuter.kv.get(publicKey);

			if (publicProject) {
				if (publicProject.ownerId === userId) {
					await mePuter.kv.del(publicKey);
				} else {
					// If they don't own the public version, just return an error or skip. 
					// But usually, they shouldn't see the delete button anyway.
					return jsonError(403, "Not authorized to delete this community project");
				}
			}
		}

		return { deleted: true, id };
	} catch (e) {
		return jsonError(500, "Failed to delete project", {
			message: e.message || "Unknown error",
			stack: e.stack
		});
	}
});
