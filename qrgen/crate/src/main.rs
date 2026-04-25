use std::env;
use std::fs;
use std::io::{self, Write};
use std::process;

use qrcode::render::svg;
use qrcode::{EcLevel, QrCode};

fn print_usage() {
    eprintln!("qrgen — emit an SVG QR code.\n");
    eprintln!("Usage:");
    eprintln!("  qrgen <content> [output.svg]");
    eprintln!();
    eprintln!("Options:");
    eprintln!("  --dark=<#hex>    foreground color (default #2b1810)");
    eprintln!("  --light=<#hex>   background color (default #efe1bf)");
    eprintln!("  --size=<px>      min square size in px (default 256)");
    eprintln!("  --ec=L|M|Q|H     error-correction level (default M)");
    eprintln!();
    eprintln!("If output is omitted, SVG is written to stdout.");
}

fn parse_ec(s: &str) -> Option<EcLevel> {
    match s {
        "L" | "l" => Some(EcLevel::L),
        "M" | "m" => Some(EcLevel::M),
        "Q" | "q" => Some(EcLevel::Q),
        "H" | "h" => Some(EcLevel::H),
        _ => None,
    }
}

fn main() {
    let mut content: Option<String> = None;
    let mut output: Option<String> = None;
    let mut dark = String::from("#2b1810");
    let mut light = String::from("#efe1bf");
    let mut size: u32 = 256;
    let mut ec = EcLevel::M;

    for arg in env::args().skip(1) {
        if let Some(v) = arg.strip_prefix("--dark=") {
            dark = v.to_string();
        } else if let Some(v) = arg.strip_prefix("--light=") {
            light = v.to_string();
        } else if let Some(v) = arg.strip_prefix("--size=") {
            size = v.parse().unwrap_or_else(|_| {
                eprintln!("invalid --size value");
                process::exit(2);
            });
        } else if let Some(v) = arg.strip_prefix("--ec=") {
            ec = parse_ec(v).unwrap_or_else(|| {
                eprintln!("invalid --ec value (expected L, M, Q, or H)");
                process::exit(2);
            });
        } else if arg == "-h" || arg == "--help" {
            print_usage();
            return;
        } else if content.is_none() {
            content = Some(arg);
        } else if output.is_none() {
            output = Some(arg);
        } else {
            eprintln!("unexpected argument: {arg}");
            process::exit(2);
        }
    }

    let Some(content) = content else {
        print_usage();
        process::exit(2);
    };

    let code = QrCode::with_error_correction_level(content.as_bytes(), ec)
        .unwrap_or_else(|e| {
            eprintln!("qr encoding error: {e}");
            process::exit(1);
        });

    let svg_out = code
        .render::<svg::Color>()
        .min_dimensions(size, size)
        .dark_color(svg::Color(&dark))
        .light_color(svg::Color(&light))
        .build();

    match output {
        Some(path) => {
            if let Err(e) = fs::write(&path, &svg_out) {
                eprintln!("write error ({path}): {e}");
                process::exit(1);
            }
        }
        None => {
            let stdout = io::stdout();
            let mut lock = stdout.lock();
            if let Err(e) = lock.write_all(svg_out.as_bytes()) {
                eprintln!("stdout write error: {e}");
                process::exit(1);
            }
        }
    }
}
