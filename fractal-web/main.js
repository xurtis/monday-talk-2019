function pageLoad(event) {
	window.canvas = new Canvas(document.querySelector("canvas"));
	window.render_worker = new RenderWorker('worker.js');
	window.render_worker.image = window.canvas.create_image();

	document
		.querySelector("input[name=native]")
		.addEventListener('click', renderNative);

	document
		.querySelector("input[name=wasm]")
		.addEventListener('click', renderWasm);

	let theme_selector = document.querySelector("input[name=theme]");
	theme_selector.addEventListener('change', selectTheme);
	theme_selector.dispatchEvent(new Event('change'));

	let wasm_selector = document.querySelector("input[name=mandelbrot]");
	wasm_selector.addEventListener('change', selectWasm);
	wasm_selector.dispatchEvent(new Event('change'));

	window.progress = document.querySelector(".progress > .bar");
}

function setProgress(progress) {
	window.progress.style["width"] = (progress * 100) + "%";
}

function renderNative(event) {
	let x = Number(document.querySelector("input[name=x]").value);
	let y = Number(document.querySelector("input[name=y]").value);
	let zoom = Number(document.querySelector("input[name=zoom]").value);
	window.render_worker.render_native(x, y, zoom);
}

function renderWasm(event) {
	let x = Number(document.querySelector("input[name=x]").value);
	let y = Number(document.querySelector("input[name=y]").value);
	let zoom = Number(document.querySelector("input[name=zoom]").value);
	window.render_worker.render_wasm(x, y, zoom);
}

function selectTheme(event) {
	window.render_worker.theme = event.target.files[0];
}

function selectWasm(event) {
	window.render_worker.wasm = event.target.files[0];
}

class Canvas {
	constructor(element) {
		this.element = element;

		let width = this.element.clientWidth - 16;
		this.element.style["box-sizing"] = "content-box";
		this.element.width = width;
		this.element.style["width"] = width;
		this.element.height = (width * 2) / 3;
		this.element.style["height"] = (width * 2) / 3;

		this.context = this.element.getContext("2d");
	}

	create_image() {
		return this.context.createImageData(
			this.element.width,
			this.element.height,
		);
	}

	set image(image) {
		this.context.putImageData(image, 0, 0);
	}
}

class RenderWorker {
	constructor(worker_url) {
		let worker = this;
		this.worker = new Worker(worker_url);

		this.worker.onmessage = (event) => {
			switch (event.data.type) {
				case "progress":
					setProgress(event.data.progress);
					break;
				case "paint":
					window.canvas.image = event.data.image;
					setProgress(1);
					break;
			}
		}
	}

	set image(image) {
		this.worker.postMessage({
			"type": "image",
			"image": image,
		});
	}

	set wasm(wasm_file) {
		this.worker.postMessage({
			"type": "wasm",
			"wasm": wasm_file,
		});
	}

	set theme(theme_file) {
		this.worker.postMessage({
			"type": "theme",
			"theme": theme_file,
		});
	}

	render_native(x, y, zoom) {
		this.worker.postMessage({
			"type": "render_native",
			"x": x,
			"y": y,
			"zoom": zoom,
		});
	}

	render_wasm(x, y, zoom) {
		this.worker.postMessage({
			"type": "render_wasm",
			"x": x,
			"y": y,
			"zoom": zoom,
		});
	}
}

window.addEventListener('load', pageLoad);
