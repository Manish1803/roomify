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

router.post("/api/projects/save", async ({ request, user }) => {
	try {
		const userPuter = user.puter;

		if (!userPuter) return jsonError(401, "Authentication failed");

		const body = await request.json();
		const project = body?.project;

		if (!project?.id || !project?.sourceImage)
			return jsonError(400, "Project ID and source image are required");

		const payload = {
			...project,
			updatedAt: new Date().toISOString(),
		};

		const userId = await getUserId(userPuter);
		if (!userId) return jsonError(401, "Authentication failed");

		const key = `${PROJECT_PREFIX}${project.id}`;
		await userPuter.kv.set(key, payload);

		return { saved: true, id: project.id, project: payload };
	} catch (e) {
		return jsonError(500, "Failed to save project", {
			message: e.message || "Unknown error",
		});
	}
});

router.get("/api/projects/list", async ({ user }) => {
	try {
		const userPuter = user.puter;
		if (!userPuter) return jsonError(401, "Authentication failed");

		const userId = await getUserId(userPuter);
		if (!userId) return jsonError(401, "Authentication failed");

		// Get private projects
		const privateProjects = (await userPuter.kv.list(PROJECT_PREFIX, true)).map(
			({ value }) => ({ ...value, isPublic: false }),
		);

		// Get public projects shared by this user
		const allPublicProjects = await puter.kv.list(PUBLIC_PROJECT_PREFIX, true);
		const userPublicProjects = allPublicProjects
			.filter(({ value }) => value.ownerId === userId)
			.map(({ value }) => ({ ...value, isPublic: true }));

		return { projects: [...privateProjects, ...userPublicProjects] };
	} catch (e) {
		return jsonError(500, "Failed to list projects", {
			message: e.message || "Unknown error",
		});
	}
});

router.get("/api/projects/get", async ({ request, user }) => {
	try {
		const userPuter = user.puter;
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
		const publicProject = await puter.kv.get(publicKey);
		if (publicProject) {
			return { project: { ...publicProject, isPublic: true } };
		}

		return jsonError(404, "Project not found");
	} catch (e) {
		return jsonError(500, "Failed to get project", {
			message: e.message || "Unknown error",
		});
	}
});

router.post("/api/projects/share", async ({ request, user }) => {
	try {
		const userPuter = user.puter;
		if (!userPuter) return jsonError(401, "Authentication failed");

		const body = await request.json();
		const { id, metadata } = body;

		if (!id) return jsonError(400, "Project ID is required");

		const privateKey = `${PROJECT_PREFIX}${id}`;
		const project = await userPuter.kv.get(privateKey);

		if (!project) return jsonError(404, "Project not found in private storage");

		// Remove from private
		await userPuter.kv.del(privateKey);

		// Add to public
		const publicPayload = {
			...project,
			...metadata,
			isPublic: true,
			sharedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		const publicKey = `${PUBLIC_PROJECT_PREFIX}${id}`;
		await puter.kv.set(publicKey, publicPayload);

		return { shared: true, project: publicPayload };
	} catch (e) {
		return jsonError(500, "Failed to share project", {
			message: e.message || "Unknown error",
		});
	}
});

router.post("/api/projects/unshare", async ({ request, user }) => {
	try {
		const userPuter = user.puter;
		if (!userPuter) return jsonError(401, "Authentication failed");

		const body = await request.json();
		const { id } = body;

		if (!id) return jsonError(400, "Project ID is required");

		const publicKey = `${PUBLIC_PROJECT_PREFIX}${id}`;
		const project = await puter.kv.get(publicKey);

		if (!project) return jsonError(404, "Project not found in public storage");

		const userId = await getUserId(userPuter);
		if (project.ownerId !== userId) {
			return jsonError(403, "Not authorized to unshare this project");
		}

		// Remove from public
		await puter.kv.del(publicKey);

		// Add back to private
		const privatePayload = {
			...project,
			isPublic: false,
			updatedAt: new Date().toISOString(),
		};
		// Clean up metadata? The user request said "put it back to private one"
		delete privatePayload.sharedBy;
		delete privatePayload.sharedAt;

		const privateKey = `${PROJECT_PREFIX}${id}`;
		await userPuter.kv.set(privateKey, privatePayload);

		return { unshared: true, project: privatePayload };
	} catch (e) {
		return jsonError(500, "Failed to unshare project", {
			message: e.message || "Unknown error",
		});
	}
});
