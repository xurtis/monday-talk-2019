# Slides
# ======

PDFVIEW ?= evince

.PHONY: slides
slides: build/slides.pdf
	${PDFVIEW} $<

build/slides.pdf: slides/slides.rst
	cd $(dir $<) && pandoc \
		-t beamer \
		-i $(notdir $<) \
		-o $(abspath $@)

# Code preview
# ============

VISUAL ?= nvim
VISUAL_TABS ?= -p

.PHONY: code
code: \
	fractal-theme/src/lib.rs \
	fractal-draw/src/lib.rs \
	python_fractal \
	fractal-web/worker.js \
	fractal-web/main.js
	${VISUAL} ${VISUAL_TABS} $^

# Build WASM modules
# ==================

THEMES = \
	build/simple-theme.wasm \
	build/red-theme.wasm \
	build/green-theme.wasm \
	build/blue-theme.wasm \
	build/position-theme.wasm \
	build/royal-theme.wasm \

RENDER = build/mandelbrot.wasm

CARGO_ARGS = \
	--release \
	--target wasm32-unknown-unknown
BUILD_PATH = wasm32-unknown-unknown/release

${RENDER}: fractal-draw/Cargo.toml fractal-draw/src/lib.rs
	mkdir -p build/render
	cargo build ${CARGO_ARGS} \
		--manifest-path $(realpath fractal-draw/Cargo.toml) \
		--target-dir build/render
	cp build/render/${BUILD_PATH}/fractal_draw.wasm $@

build/%-theme.wasm: fractal-theme/Cargo.toml fractal-theme/src/lib.rs
	mkdir -p build/render
	cargo build ${CARGO_ARGS} \
		--manifest-path $(realpath fractal-theme/Cargo.toml) \
		--target-dir build/render \
		--no-default-features \
		--features $(patsubst %-theme.wasm,%,$(notdir $@))
	cp build/render/${BUILD_PATH}/fractal_theme.wasm $@

# Run WASM web browser demo
# =========================

BROWSER ?= firefox --private-window

.PHONY: web-demo
web-demo: ${RENDER} ${THEMES}
	${BROWSER} $(realpath fractal-web/index.html)

# Run WASM in Python3 with tkinter
# ================================

# Location of python wasmtime modules
PYTHON_WASMTIME_DIR = wasmtime/misc/wasmtime-py
PYTHON_WASMTIME = ${PYTHON_WASMTIME_DIR}/build/lib
PYTHON_WASMTIME_FILES = $(shell find ${PYTHON_WASMTIME_DIR} -type f)

# Default mandelbrot location
RE   ?= -1.522303068459152
IM   ?= 0.005115452548480
ZOOM ?= 35

# Default theme to use
PYTHON_THEME ?= build/simple-theme.wasm

.PHONY: ${PYTHON_WASMTIME}
${PYTHON_WASMTIME}: ${PYTHON_WASMTIME_FILES}
	cd ${PYTHON_WASMTIME_DIR} \
		&& rustup run nightly python3 setup.py build

.PHONY: python
python-demo: ${RENDER} ${PYTHON_THEME} ${PYTHON_WASMTIME}
	PYTHONPATH="${PYTHON_WASMTIME}:${PYTHONPATH}" \
		python3 \
		./python_fractal \
		${PYTHON_THEME} \
		${RENDER} \
		${RE} ${IM} ${ZOOM}
