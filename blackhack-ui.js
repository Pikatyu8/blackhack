/* blackhack-ui.js */
(function () {
	'use strict';
	const BH = window.BH = window.BH || {};

	BH.createZoom = () => {
		let oW = window.innerWidth, oH = window.innerHeight;
		document.onkeydown = e => { if (e.keyCode === 48) { e.preventDefault(); window.innerWidth = oW; window.innerHeight = oH; } };
		document.onwheel = e => {
			e.preventDefault();
			const f = e.deltaY < 0 ? 1.1 : 1 / 1.1;
			window.innerWidth *= f; window.innerHeight *= f;
		};
	};

	BH.createUI = () => {
		const hack = window.hack, { clamp, round3, saveSettings, DEFAULTS } = BH;
		const panel = document.createElement('div');
		panel.id = 'hk-panel';
		panel.innerHTML = `
<style>
#hk-panel{position:fixed;top:8px;left:8px;z-index:999999;background:#181818;color:#ccc;font:12px/1.5 monospace;border:1px solid #333;border-radius:6px;min-width:260px;user-select:none;box-shadow:0 2px 12px rgba(0,0,0,.5)}
#hk-panel *{box-sizing:border-box}
.hk-tabs{display:flex;border-bottom:1px solid #333}
.hk-tab{flex:1;padding:6px 0;text-align:center;background:#111;color:#666;border:none;cursor:pointer;font:inherit;transition:background .15s,color .15s}
.hk-tab:first-child{border-radius:6px 0 0 0}.hk-tab:last-child{border-radius:0 6px 0 0}
.hk-tab.active{background:#2a2a2a;color:#fff}.hk-tab:hover:not(.active){background:#1e1e1e;color:#aaa}
.hk-pane{display:none;padding:10px 12px}.hk-pane.active{display:block}
.hk-row{display:flex;align-items:center;margin:4px 0}
.hk-row label{color:#aaa;white-space:nowrap;min-width:100px}
.hk-row input[type=number]{width:64px;padding:3px 4px;background:#0e0e0e;color:#fff;border:1px solid #444;border-radius:3px;text-align:center;font:inherit;outline:none;-moz-appearance:textfield}
.hk-row input[type=number]::-webkit-outer-spin-button,.hk-row input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
.hk-row input[type=number]:focus{border-color:#777}
.hk-range{color:#555;font-size:10px;margin-left:6px;white-space:nowrap}
.hk-btn{width:100%;margin-top:6px;padding:5px 0;background:#333;color:#ddd;border:1px solid #555;border-radius:3px;cursor:pointer;font:inherit;transition:background .15s}
.hk-btn:hover{background:#444}
.hk-btn.hk-reset{background:#2a1a1a;border-color:#553333}.hk-btn.hk-reset:hover{background:#3a2020}
.hk-sep{border:none;border-top:1px solid #2a2a2a;margin:6px 0}
.hk-foot{padding:4px 12px 8px;border-top:1px solid #2a2a2a}
.hk-ind-row{display:flex;justify-content:center;align-items:center;gap:8px;padding:6px 0 2px}
.hk-ind-dot{width:12px;height:12px;border-radius:50%;background:#0f0;transition:background .15s;box-shadow:0 0 4px rgba(0,0,0,.6)}
.hk-ind-gap{width:12px;height:12px;border-radius:50%;background:#555;box-shadow:0 0 4px rgba(0,0,0,.6)}
.hk-bl-add-row{display:flex;gap:6px;margin-bottom:8px}
#hk-bl-input{flex:1;padding:4px 8px;background:#0e0e0e;color:#fff;border:1px solid #444;border-radius:3px;font:inherit;outline:none}
#hk-bl-input:focus{border-color:#777}#hk-bl-input::placeholder{color:#555}
.hk-bl-addbtn{width:auto!important;margin:0!important;padding:4px 12px!important;flex-shrink:0}
#hk-bl-list{max-height:180px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:#333 #181818}
#hk-bl-list::-webkit-scrollbar{width:5px}#hk-bl-list::-webkit-scrollbar-track{background:#181818}
#hk-bl-list::-webkit-scrollbar-thumb{background:#444;border-radius:3px}
.hk-bl-item{display:flex;align-items:center;padding:4px 2px;border-bottom:1px solid #222}.hk-bl-item:last-child{border-bottom:none}
.hk-bl-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;margin-right:8px;background:#444;transition:background .3s}.hk-bl-dot.hk-on{background:#0f0}
.hk-bl-name{flex:1;color:#ccc;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hk-bl-x{background:none;border:none;color:#555;cursor:pointer;font-size:18px;line-height:1;padding:0 4px;transition:color .15s}.hk-bl-x:hover{color:#f44}
.hk-bl-empty{color:#444;text-align:center;padding:16px 0;font-style:italic}
</style>
<div class="hk-tabs">
	<button class="hk-tab active" data-t="0">Параметры</button>
	<button class="hk-tab" data-t="1">Прозрачность</button>
	<button class="hk-tab" data-t="2">Блоклист</button>
</div>
<div class="hk-pane active" data-t="0">
	<div class="hk-row"><label>Множитель</label><input type="number" id="hk-mult" step="0.001"><span class="hk-range">-9 … 9</span></div>
	<div class="hk-row"><label>Грав. шкала</label><input type="number" id="hk-gs" step="0.001"><span class="hk-range">-10 … 10</span></div>
	<div class="hk-row"><label>Выс. прыжка</label><input type="number" id="hk-jh" step="0.001"><span class="hk-range">0.2 … 50</span></div>
	<hr class="hk-sep">
	<div class="hk-row"><label>Масса</label><input type="number" id="hk-mass" step="0.001"><span class="hk-range">-10 … 10</span></div>
	<div class="hk-row"><label>Сопротивление</label><input type="number" id="hk-damp" step="0.001"><span class="hk-range">0 … 1</span></div>
</div>
<div class="hk-pane" data-t="1">
	<div class="hk-row"><label>Все</label><input type="number" id="hk-aa" step="0.001"><span class="hk-range">0 … 1</span></div>
	<hr class="hk-sep">
	<div class="hk-row"><label>Тела</label><input type="number" id="hk-ac" step="0.001"><span class="hk-range">0 … 1</span></div>
	<div class="hk-row"><label>Яд</label><input type="number" id="hk-ap" step="0.001"><span class="hk-range">0 … 1</span></div>
	<div class="hk-row"><label>Функционал</label><input type="number" id="hk-af" step="0.001"><span class="hk-range">0 … 1</span></div>
	<button class="hk-btn" id="hk-al-apply">Применить</button>
</div>
<div class="hk-pane" data-t="2">
	<div class="hk-bl-add-row">
		<input type="text" id="hk-bl-input" placeholder="Никнейм игрока" maxlength="32">
		<button class="hk-btn hk-bl-addbtn" id="hk-bl-add">+</button>
	</div>
	<div id="hk-bl-list"></div>
	<div id="hk-bl-empty" class="hk-bl-empty">Список пуст</div>
</div>
<div class="hk-foot">
	<div class="hk-ind-row">
		<span class="hk-ind-dot" id="hk-d-nc"></span><span class="hk-ind-dot" id="hk-d-im"></span>
		<span class="hk-ind-dot" id="hk-d-gn"></span><span class="hk-ind-gap"></span>
		<span class="hk-ind-dot" id="hk-d-lm"></span>
	</div>
	<button class="hk-btn hk-reset" id="hk-reset">Сброс настроек</button>
</div>`;

		document.body.appendChild(panel);
		panel.querySelectorAll('.hk-tab').forEach(btn => {
			btn.addEventListener('click', () => {
				panel.querySelectorAll('.hk-tab').forEach(b => b.classList.remove('active'));
				panel.querySelectorAll('.hk-pane').forEach(p => p.classList.remove('active'));
				btn.classList.add('active');
				panel.querySelector(`.hk-pane[data-t="${btn.dataset.t}"]`).classList.add('active');
			});
		});
		panel.addEventListener('keydown', e => e.stopPropagation());
		panel.addEventListener('keyup', e => e.stopPropagation());

		const $ = id => panel.querySelector('#' + id);
		const readInput = (el, min, max) => round3(clamp(parseFloat(el.value) || 0, min, max));

		function populateFields() {
			$('hk-mult').value = hack.vars.mult.uiValue;
			$('hk-gs').value   = hack.vars.gravNoclipGravScale;
			$('hk-jh').value   = hack.vars.jumpHeight;
			$('hk-mass').value = hack.vars.playerMass;
			$('hk-damp').value = hack.vars.playerDamping;
			$('hk-aa').value   = hack.vars.layoutAlpha.collision;
			$('hk-ac').value   = hack.vars.layoutAlpha.collision;
			$('hk-ap').value   = hack.vars.layoutAlpha.poison;
			$('hk-af').value   = hack.vars.layoutAlpha.functional;
		}
		populateFields();

		const bindField = (id, min, max, setter) => {
			$(id).addEventListener('change', function () {
				const v = readInput(this, min, max); this.value = v; setter(v); saveSettings();
			});
		};
		bindField('hk-mult', -9, 9, v => { hack.vars.mult.uiValue = v; if (hack.vars.mult.enabled) hack.vars.mult.value = v; });
		bindField('hk-gs', -10, 10, v => { hack.vars.gravNoclipGravScale = v; });
		bindField('hk-jh', 0.2, 50, v => { hack.vars.jumpHeight = v; });
		bindField('hk-mass', -10, 10, v => { hack.vars.playerMass = v; });
		bindField('hk-damp', 0, 1, v => { hack.vars.playerDamping = v; });

		$('hk-aa').addEventListener('change', function () {
			const v = readInput(this, 0, 1); this.value = v;
			$('hk-ac').value = v; $('hk-ap').value = v; $('hk-af').value = v;
			hack.vars.layoutAlpha.collision = hack.vars.layoutAlpha.poison = hack.vars.layoutAlpha.functional = v;
			saveSettings();
		});
		bindField('hk-ac', 0, 1, v => { hack.vars.layoutAlpha.collision = v; });
		bindField('hk-ap', 0, 1, v => { hack.vars.layoutAlpha.poison = v; });
		bindField('hk-af', 0, 1, v => { hack.vars.layoutAlpha.functional = v; });

		$('hk-al-apply').addEventListener('click', () => {
			if (hack.vars.layoutMode) {
				const lp = hack.getLP();
				if (lp) hack.vars.layoutSavedPos = { x: lp.getX(), y: lp.getY() };
				if (hack.reloadMap()) hack.restoreAfterReload();
			}
		});

		// ─── Blacklist ───
		const blList = $('hk-bl-list'), blEmpty = $('hk-bl-empty'), blInput = $('hk-bl-input');
		function refreshBL() {
			const names = hack.vars.blacklisted.names;
			blList.innerHTML = ''; blEmpty.style.display = names.length ? 'none' : 'block';
			for (const name of names) {
				const online = hack.isPlayerOnline(name);
				const item = document.createElement('div'); item.className = 'hk-bl-item';
				const dot = document.createElement('span'); dot.className = 'hk-bl-dot' + (online ? ' hk-on' : '');
				const nm = document.createElement('span'); nm.className = 'hk-bl-name'; nm.textContent = name;
				const x = document.createElement('button'); x.className = 'hk-bl-x'; x.textContent = '×';
				x.addEventListener('click', () => hack.funcs.handlers.blacklistRemove(name));
				item.append(dot, nm, x); blList.appendChild(item);
			}
		}
		hack._refreshBL = refreshBL; refreshBL(); setInterval(refreshBL, 2000);

		function addFromInput() {
			const n = blInput.value.trim(); if (!n) return;
			hack.funcs.handlers.blacklistAdd(n); blInput.value = '';
		}
		$('hk-bl-add').addEventListener('click', addFromInput);
		blInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addFromInput(); } });

		$('hk-reset').addEventListener('click', () => {
			hack.vars.mult.uiValue = DEFAULTS.mult;
			if (hack.vars.mult.enabled) hack.vars.mult.value = DEFAULTS.mult;
			hack.vars.gravNoclipGravScale = DEFAULTS.gravScale;
			hack.vars.jumpHeight = DEFAULTS.jumpHeight;
			hack.vars.playerMass = DEFAULTS.mass;
			hack.vars.playerDamping = DEFAULTS.damping;
			hack.vars.layoutAlpha.collision = DEFAULTS.alphaCollision;
			hack.vars.layoutAlpha.poison = DEFAULTS.alphaPoison;
			hack.vars.layoutAlpha.functional = DEFAULTS.alphaFunctional;
			populateFields(); saveSettings();
		});

		document.addEventListener('keydown', e => {
			if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); panel.style.display = panel.style.display === 'none' ? '' : 'none'; }
		}, true);
	};
})();
