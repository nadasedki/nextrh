from pdf2docx import Converter
import sys
import os

# Inputs
input_pdf = sys.argv[1]
output_docx = sys.argv[2]

try:
    # Ensure input exists
    if not os.path.exists(input_pdf):
        print("ERROR: Input PDF not found")
        sys.exit(1)

    # Create converter
    cv = Converter(input_pdf)

    # Convert PDF → DOCX
    cv.convert(output_docx, start=0, end=None)

    # Close properly
    cv.close()

    # Confirm output exists
    if os.path.exists(output_docx):
        print(f"SUCCESS:{output_docx}")
        sys.exit(0)
    else:
        print("ERROR: DOCX not created")
        sys.exit(1)

except Exception as e:
    print(f"EXCEPTION:{str(e)}")
    sys.exit(1)