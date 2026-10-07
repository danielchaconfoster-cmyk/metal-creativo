import os
from playwright.sync_api import sync_playwright

def render_html_to_pdf(html_path, pdf_path):
    abs_html = os.path.abspath(html_path).replace("\\", "/")
    abs_pdf = os.path.abspath(pdf_path)
    url = f"file:///{abs_html}"
    
    print(f"Rendering {url} -> {abs_pdf}")
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(url, wait_until="networkidle")
        page.pdf(
            path=abs_pdf,
            format="A4",
            print_background=True,
            margin={"top": "10mm", "bottom": "10mm", "left": "10mm", "right": "10mm"}
        )
        browser.close()
    print(f"PDF generated: {abs_pdf}")

if __name__ == "__main__":
    base_dir = r"c:\Users\usuario\Desktop\Nacho proyecto"
    
    render_html_to_pdf(
        os.path.join(base_dir, "manual-lanza-pdf.html"),
        os.path.join(base_dir, "Manual_Tecnico_Lanza_Metal_Creativo.pdf")
    )
    print("Manual PDF regenerated successfully!")
