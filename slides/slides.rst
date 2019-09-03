==============================
 WASM: untrusted at any speed
==============================

:Author: Curtis Millar
:Date: Monday, 9th September, 2019

What is WASM?
=============

WebAssembly (WASM) is a specification of a stack machine.

* Compiles to native machine code at runtime
* Guarantees a number of safety and security properties
* Embeds into other languages or systems via a runtime
* Provides low-overhead and portable foreign-function interface
* Allows a single compiled module to be used in any context
* Does not need to be rebuilt for specific architectures or platforms

What does WASM look like?
=========================

Rust source
-----------

.. code:: rust

   #[no_mangle]
   pub extern fn add(a: u64, b: u64) -> u64 {
       a + b
   }

Compiled WASM
-------------

.. code:: wat

   (module
     (type (;1;) (func (param i64 i64) (result i64)))
     (func $add (type 1) (param i64 i64) (result i64)
       local.get 1
       local.get 0
       i64.add)
     (export "add" (func $add)))

WASM data, types, & references
==============================

* Four basic data types: ``i32``, ``i64``, ``f32``, & ``f64``
* Instructions operate on the stack (not addressable), linear memories
  (addressable) for data, tables (addressable) for indirect function
  call, and global index spaces for global constants
* Runtime passes data via the linear memories and functions via tables
* Everything is bundled into 'modules'

Portability
===========

* Designed to be ahead-of-time compiled (similar to Java or .NET)
* Can alternatively be interpreted (but that is slow)
* Requires runtime embedding
  * Compile the module into native machine code
  * Implement FFI into compiled machine code
  * Manage memory for passed data
* Write in any source language (e.g. Rust, C, Go, or TypeScript)

(Almost) native speed
=====================

* Compiles down to similar machine code as if directly from the language
* Currently does not support some optimisations available in native
  compilation (e.g. SIMD)
* Can load multiple modules into the same address space/runtime
  * Low switching overhead
  * Better hardware utilisation

Security & Trust
================

* Compliant runtime compilers must ensure bounds checking on table and
  linear memory access
* Code cannot access data outside of linear memory
* Code cannot access raw pointers from tables (can only call into
  functions with code that adheres to the interface type, even for
  indirect calls)
* Cannot call methods not explicitly provided to it
* Type-safe (data types, memory stores, function calls)
* Prevents direct access between modules loaded into the same address
  space (although timing channels may still exist)
* Potential security enhancements (not required, but currently possible):
  * Runtime code and memory layout randomisation

Mandelbrot (Demo)
=================

.. figure:: almondbread.png

   http://almondbread.cse.unsw.edu.au

----

Theme
-----

.. code:: rust

   #[no_mangle]
   pub extern
   fn color_pixel(steps: u32, _re: f64, _im: f64) -> u32 {
       let level = steps as u8;
       let color = Color {
           red: level,
           green: level,
           blue: level,
      };
      color.into()
   }

   #[no_mangle]
   pub extern fn max_steps() -> u32 { 256 }

----

Mandelbrot
----------

.. code:: rust

   extern "C" {
       // Canvas
       fn canvas_width() -> u32;
       fn canvas_height() -> u32;
       fn draw_pixel(x: u32, y: u32, color: u32);
       fn paint();

       // Theme
       fn color_pixel(steps: u32, re: f64, im: f64) -> u32;
       fn max_steps() -> u32;

       // Progress bar
       fn progress(progress: f64);
   }

----

.. code:: rust

   #[no_mangle]
   pub extern
   fn render(center_re: f64, center_im: f64, zoom: u32) {
       let (width, height) = canvas_dimensions();
       let distance = 1f64 / ((1u64 << zoom) as f64);
       for pixel_y in 0u32..height {
           for pixel_x in 0u32..width {
               let re = (pixel_x - width/2) as f64;
               let im = (pixel_y - height/2) as f64;
               let c = Complex::new(
                   center_re + re * distance,
                   center_im + im * distance,
               );
               draw_steps(pixel_x, pixel_y, c);
           }
       }
       unsafe { paint(); }
   }

----

.. code:: rust

   fn draw_steps(x: u32, y: u32, c: Complex<f64>) {
       let mut z = Complex::new(0f64, 0f64);
       let mut steps = 0;
       let max_steps = unsafe { max_steps() };
       while z.norm_sqr() < 4.0 && steps < max_steps {
           z = z * z + c;
           steps += 1;
       }
       unsafe {
           draw_pixel(x, y, color_pixel(steps, c.re, c.im));
       }
   }

----

* WASM in Python
* WASM in Firefox

Where can I use WASM now?
=========================

* Supported in major browsers (Chrome, Firefox, Edge, Safari, etc.)
* Supported in the cloud (Cloudflare Workers, AWS Lambda)
* Language runtimes (wasmtime[1]_ & wasmer[2]_ for Rust, Python, C/C++,
  Go, PHP, Ruby, Postgres, .NET, R, Swift, & POSIX)

.. [1] https://github.com/CraneStation/wasmtime

.. [2] https://wasmer.io/

WASM in the future
==================

* Standard WASM runtime interface (WASI)
* Interface types (automatic interface generation)
* Threads & atomic primitives
* Garbage collected data
* Reference types
* Explicit tail call
* SIMD

More references
===============

* Official site: https://webassembly.org/
* Mozilla Hacks blog: https://hacks.mozilla.org/category/webassembly/
* Mozilla Developer Network: https://developer.mozilla.org/en-US/docs/WebAssembly
* WebAssembly Rocks: http://www.wasmrocks.com/
* Even more references: https://github.com/mbasso/awesome-wasm
