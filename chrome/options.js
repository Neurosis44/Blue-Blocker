import { DefaultOptions } from '../shared.js';

// restore state from storage
document.addEventListener("DOMContentLoaded", () => {
	chrome.storage.local.get(DefaultOptions, (items) => {
		document.getElementById("block-following").checked = items.blockFollowing;
		document.getElementById("block-legacy").checked = items.blockLegacy;
    document.getElementById("blocked-users-count").textContent = Object.keys(items.blue_blocked_users).length;
	});
});

document.getElementById("block-following").addEventListener("input", () => {
	chrome.storage.local.set({
		blockFollowing: document.getElementById("block-following").checked,
	}, () => {
		// Update status to let user know options were saved.
		const status = document.getElementById("block-following-status");
		status.textContent = "saved";
		setTimeout(() => status.textContent = null, 1000);
	});
});

document.getElementById("block-legacy").addEventListener("input", () => {
	chrome.storage.local.set({
		blockLegacy: document.getElementById("block-legacy").checked,
	}, () => {
		// Update status to let user know options were saved.
		const status = document.getElementById("block-legacy-status");
		status.textContent = "saved";
		setTimeout(() => status.textContent = null, 1000);
	});
});
