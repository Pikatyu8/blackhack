/* blackhack-utils.js */
(function () {
	'use strict';
	const BH = window.BH = window.BH || {};

	BH.clamp = (v, min, max) => Math.max(min, Math.min(max, v));
	BH.round3 = v => Math.round(v * 1000) / 1000;

	const _c = document.createElement('canvas'), _x = _c.getContext('2d');
	BH.measureTextWidth = (fs, t) => { _x.font = fs + 'px Arial'; return Math.round(_x.measureText(t).width); };

	BH.STORAGE_KEY = 'blackhack_settings';
	BH.DEFAULTS = {
		mult: 3, gravScale: 2, jumpHeight: 8,
		mass: 1, damping: 0.9,
		alphaCollision: 1, alphaPoison: 1, alphaFunctional: 1
	};

	BH.saveSettings = () => {
		try {
			const v = window.hack.vars;
			localStorage.setItem(BH.STORAGE_KEY, JSON.stringify({
				mult: v.mult.uiValue, gravScale: v.gravNoclipGravScale,
				jumpHeight: v.jumpHeight, mass: v.playerMass, damping: v.playerDamping,
				alphaCollision: v.layoutAlpha.collision, alphaPoison: v.layoutAlpha.poison,
				alphaFunctional: v.layoutAlpha.functional
			}));
		} catch (_) {}
	};

	BH.loadSettings = () => {
		try {
			const raw = localStorage.getItem(BH.STORAGE_KEY);
			if (raw) return { ...BH.DEFAULTS, ...JSON.parse(raw) };
		} catch (_) {}
		return { ...BH.DEFAULTS };
	};

	BH.loadLZMA = () => {
		if (!window.LZMA) {
			fetch('https://raw.githubusercontent.com/LZMA-JS/LZMA-JS/master/src/lzma_worker-min.js')
				.then(r => r.text())
				.then(code => {
					try {
						const om = window.onmessage;
						const s = document.createElement('script');
						s.textContent = code;
						document.head.appendChild(s);
						s.remove();
						window.onmessage = om;
					} catch (_) {}
				}).catch(() => {});
		}
	};
})();
