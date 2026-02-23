from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import json
import re
import time

URL = (
    "https://energycost.gr/"
    "%CF%85%CF%80%CE%BF%CE%BB%CE%BF%CE%B3%CE%B9%CF%83%CE%BC%CF%8C%CF%82-"
    "%CF%84%CE%B9%CE%BC%CE%AE%CF%82-%CE%B2%CE%AC%CF%83%CE%B5%CE%B9-"
    "%CE%BA%CE%B1%CF%84%CE%B1%CE%BD%CE%AC%CE%BB%CF%89%CF%83%CE%B7%CF%82-2/"
)

def scrape_prices():
    options = Options()
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    # Run Chrome in headless mode (no browser UI)
    try:
        options.add_argument("--headless=new")
    except Exception:
        options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("window-size=1920,1080")

    driver = webdriver.Chrome(options=options)
    driver.get(URL)

    # Wait for the table to be present
    WebDriverWait(driver, 15).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "#billing_table tbody tr"))
    )
    # Extra wait for JS to finish rendering rows
    time.sleep(3)

    rows = driver.find_elements(By.CSS_SELECTOR, "#billing_table tbody tr")
    results = []

    for row in rows:
        try:
            provider = row.find_element(By.CSS_SELECTOR, "td.rae-inv-company-name").text.strip()
            plan_el = row.find_element(By.CSS_SELECTOR, "td.rae-inv-product-name")
            plan_name = plan_el.text.strip()
            tariff_type = plan_el.get_attribute("data-filter-value") or ""

            # Price with discount (visible by default)
            price_el = row.find_element(
                By.CSS_SELECTOR,
                "td.teliki_timi_promithias_meta_apo_ekptoseis_promithias"
            )
            price_html = price_el.get_attribute("innerHTML").strip()
            price_text = price_el.text.strip()

            # Handle tiered pricing (multiple <b> values)
            bold_values = re.findall(r"<b>([\d.]+)</b>", price_html)
            if bold_values:
                price_per_kwh = float(bold_values[-1])  # last = blended/average rate
            else:
                # Try plain numeric text
                numeric = re.search(r"^[\d.]+$", price_text)
                price_per_kwh = float(numeric.group()) if numeric else None

            # Monthly fee with discount
            try:
                fee_el = row.find_element(By.CSS_SELECTOR, "td.pagio_me_proipotheseis")
                fee_text = fee_el.text.strip()
                monthly_fee = float(fee_text) if fee_text else None
            except Exception:
                monthly_fee = None

            results.append({
                "provider": provider,
                "plan": plan_name,
                "tariff_type": tariff_type,
                "price_per_kwh": price_per_kwh,
                "monthly_fee_eur": monthly_fee,
            })
        except Exception as e:
            print(f"Skipping row: {e}")
            continue

    driver.quit()

    with open("prices.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"Scraped {len(results)} plans, saved to prices.json")
    return results


if __name__ == "__main__":
    scrape_prices()
