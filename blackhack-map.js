/* blackhack-map.js */
(function () {
	'use strict';
	const BH = window.BH = window.BH || {};
	const leverParts = new Set(['leftstick', 'leftball', 'rightstick', 'rightball']);

	function getFuncLabel(sid) {
		if (sid === 'spawn') return 'S';
		if (sid === 'checkpoint') return 'C';
		if (sid === 'playarea') return 'P';
		if (sid === 'exitgate') return 'D';
		if (sid.startsWith('button:')) return 'B';
		if (sid.startsWith('leaver:')) return 'L';
		return null;
	}

	function makeStub() {
		return { x: 0, y: 0, type: 1, width: 1, height: 1, alpha: 0, id: '', collision: false, color: '0x000000', make: 3 };
	}

	function processShape(sh, oid, isFakeStatic, al) {
		const sid = (sh.id || '').toLowerCase();
		const isPoison = sid === 'poision' || sid === 'poison';
		if (sh.collision === false && !isPoison) return null;
		const c = { ...sh };
		c.alpha = isPoison ? al.poison : al.collision;
		c.color = isPoison ? '0x00FF00' : (isFakeStatic ? '0xFFFF00' : '0x000000');
		const out = [];
		if (sh.type === 3 && !oid.includes('mapcredits')) {
			out.push({ ...c, type: 1, id: '', make: 3, alpha: 0.3,
				width: BH.measureTextWidth(sh.fontSize, sh.text), height: sh.fontSize * 1.108 });
		}
		out.push(c);
		return out;
	}

	BH.parseMapToLayout = mapData => {
		const { clamp, measureTextWidth } = BH;
		const al = window.hack?.vars?.layoutAlpha || { collision: 1, poison: 1, functional: 1, background: 0xCCCCCC };
		let parsed = mapData;
		try {
			if (typeof parsed === 'string') parsed = JSON.parse(parsed);
			if (Array.isArray(parsed) && typeof parsed[0] === 'number' && window.LZMA)
				parsed = JSON.parse(window.LZMA.decompress(parsed));
		} catch (e) { return mapData; }
		try { parsed = JSON.parse(JSON.stringify(parsed)); } catch (_) {}

		const result = [];
		for (const obj of parsed) {
			if (!obj || !obj.shapes || !obj.shapes.length) { result.push(obj || {}); continue; }
			const oid = (obj.id || '').toLowerCase();

			if (oid.includes('99999999999')) {
				obj.shapes = obj.shapes.map(sh => sh ? { ...sh, alpha: 0, collision: false, make: 3 } : sh);
				result.push(obj); continue;
			}

			const shapes = obj.shapes;
			const isFakeStatic = typeof obj.mass === 'number' && obj.mass !== 0 && Math.abs(obj.mass) < 1e-6;
			const isFunctional = oid === 'spawn' || oid === 'door' || oid === 'playarea' || oid === 'checkpoint' ||
				shapes.some(s => {
					if (!s || !s.id) return false;
					const sid = s.id.toLowerCase();
					return sid === 'spawn' || sid === 'playarea' || sid === 'checkpoint' || sid === 'exitgate' ||
						sid === 'egcounter' || sid.startsWith('roundtime:') || sid.startsWith('button:') || sid.startsWith('leaver:');
				});

			if (isFunctional) {
				const hasLeaver = shapes.some(s => s && s.id && s.id.toLowerCase().startsWith('leaver:'));
				const fs = [];
				for (const sh of shapes) {
					if (!sh) continue;
					const sid = (sh.id || '').toLowerCase();
					const isFunc = sid === 'spawn' || sid === 'playarea' || sid === 'checkpoint' || sid === 'exitgate' ||
						sid === 'egcounter' || sid.startsWith('roundtime:') || sid.startsWith('button:') || sid.startsWith('leaver:');
					if (isFunc) {
						const c = { ...sh };
						if (sid === 'egcounter' || (sid.startsWith('roundtime:') && sh.make === 3)) { c.alpha = 0; fs.push(c); continue; }
						c.alpha = al.functional; c.color = '0x0000FF'; fs.push(c);
						const label = getFuncLabel(sid);
						if (label) {
							const w = Math.abs(sh.width || 30), h = Math.abs(sh.height || 30);
							const fontSize = clamp(Math.min(w, h) * 0.6, 8, 30);
							fs.push({ x: sh.x || 0, y: sh.y || 0, width: measureTextWidth(fontSize, label),
								height: fontSize * 1.108, angle: -(obj.angle || 0), radius: 50, alpha: 1,
								id: '', collision: false, color: '0x000000', fontSize, text: label, make: 3, type: 3 });
						}
						continue;
					}
					if (sh.make === 3 && hasLeaver && leverParts.has(sid)) { fs.push({ ...sh }); continue; }
					if (sh.make === 3) continue;
					const r = processShape(sh, oid, isFakeStatic, al);
					if (r) fs.push(...r);
				}
				if (!fs.length) fs.push(makeStub());
				obj.shapes = fs; result.push(obj); continue;
			}

			if (oid.includes('cover')) {
				obj.id = obj.id.split('|').filter(p => !p.trim().toLowerCase().startsWith('cover')).join('|');
			}
			const fs = [];
			for (const sh of shapes) {
				if (!sh || sh.make === 3) continue;
				const r = processShape(sh, oid, isFakeStatic, al);
				if (r) fs.push(...r);
			}
			if (!fs.length) fs.push(makeStub());
			obj.shapes = fs; result.push(obj);
		}
		return result;
	};
})();
