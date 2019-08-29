/// Example source code for function
#[no_mangle]
pub extern fn add(a: u64, b: u64) -> u64 {
    a + b
}

// Produces:
//
// (module
//   (type (;1;) (func (param i64 i64) (result i64)))
//   (func $add (type 1) (param i64 i64) (result i64)
//     local.get 1
//     local.get 0
//     i64.add)
//   (export "add" (func $add)))
