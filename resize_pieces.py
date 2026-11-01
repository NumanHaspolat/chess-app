
from PIL import Image
import os

INPUT_DIR = "assets/pieces"
OUTPUT_DIR = "assets/pieces"

CANVAS_SIZE = 147

PIECE_SIZES = {
    "P": 110,   # Pawn
    "N": 130,  # Knight
    "B": 130,  # Bishop
    "R": 125,  # Rook
    "Q": 130,  # Queen
    "K": 135,  # King
}

pieces = [
    "wP", "wN", "wB", "wR", "wQ", "wK",
    "bP", "bN", "bB", "bR", "bQ", "bK"
]

os.makedirs(OUTPUT_DIR, exist_ok=True)

for name in pieces:
    input_path = os.path.join(INPUT_DIR, name + ".png")

    if not os.path.exists(input_path):
        print(f"Not found: {input_path}")
        continue

    image = Image.open(input_path).convert("RGBA")

    bbox = image.getbbox()

    if bbox is None:
        print(f"Empty image: {name}")
        continue

    # Remove transparent margins
    image = image.crop(bbox)

    # Get target size for this piece
    size = PIECE_SIZES[name[1]]

    # Resize proportionally (can enlarge AND shrink)
    scale = min(size / image.width, size / image.height)

    new_width = max(1, int(image.width * scale))
    new_height = max(1, int(image.height * scale))

    image = image.resize(
        (new_width, new_height),
        Image.Resampling.LANCZOS
    )

    # Create transparent canvas
    canvas = Image.new(
        "RGBA",
        (CANVAS_SIZE, CANVAS_SIZE),
        (0, 0, 0, 0)
    )

    # Center the piece
    x = (CANVAS_SIZE - image.width) // 2
    y = (CANVAS_SIZE - image.height) // 2

    canvas.alpha_composite(image, (x, y))

    # Save PNG
    output_path = os.path.join(OUTPUT_DIR, name + ".png")
    canvas.save(output_path)

    print(f"Created: {name}.png ({new_width}x{new_height})")

print("All pieces processed successfully!")
