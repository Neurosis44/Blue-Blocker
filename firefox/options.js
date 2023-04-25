import { DefaultOptions } from '../shared.js';

// restore state from storage
document.addEventListener("DOMContentLoaded", () => {
	browser.storage.local.get(DefaultOptions).then(items => {
		document.getElementById("block-following").checked = items.blockFollowing;
		document.getElementById("block-legacy").checked = items.blockLegacy;
    document.getElementById("blocked-users-count").textContent = Object.keys(items.blue_blocked_users).length;
	});
});

document.getElementById("block-following").addEventListener("input", () => {
	browser.storage.local.set({
		blockFollowing: document.getElementById("block-following").checked,
	}).then(() => {
		// Update status to let user know options were saved.
		const status = document.getElementById("block-following-status");
		status.textContent = "saved";
		setTimeout(() => status.textContent = null, 1000);
	});
});

document.getElementById("block-legacy").addEventListener("input", () => {
	browser.storage.local.set({
		blockLegacy: document.getElementById("block-legacy").checked,
	}).then(() => {
		// Update status to let user know options were saved.
		const status = document.getElementById("block-legacy-status");
		status.textContent = "saved";
		setTimeout(() => status.textContent = null, 1000);
	});
});