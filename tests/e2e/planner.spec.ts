import { test, expect, type Page } from "@playwright/test";
async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("아이디", { exact: true }).fill("fixture_a");
  await page
    .getByLabel("비밀번호", { exact: true })
    .fill("fixture-only-password");
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "대구 → 나리타 → 도쿄 → 센다이",
      exact: true,
    }),
  ).toBeVisible();
}
async function menu(page: Page, name: string) {
  await page.getByRole("button", { name: "더보기", exact: true }).click();
  await page.getByRole("button", { name, exact: true }).click();
}
test.beforeEach(async ({ request }) => {
  await request.post("http://127.0.0.1:3101/test/reset");
});
test("protects routes and rejects wrong credentials without signup", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL(/login/);
  await expect(page.getByRole("button", { name: /가입/ })).toHaveCount(0);
  await page.getByLabel("아이디", { exact: true }).fill("fixture_a");
  await page.getByLabel("비밀번호", { exact: true }).fill("wrong");
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(page.locator(".error[role=alert]")).toContainText(
    "아이디 또는 비밀번호",
  );
  expect((await request.get("/api/data")).ok()).toBe(false);
});
test("mobile schedule, packing, reservation, spending and Places flows", async ({
  page,
}) => {
  await login(page);
  await expect(page.getByText("미완료 0", { exact: true })).toHaveCount(0);
  expect(
    await page
      .locator(".dates")
      .evaluate((el) => el.scrollWidth <= el.clientWidth),
  ).toBe(true);
  await page.screenshot({ path: "/tmp/senkyo-today.png" });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "일정", exact: true }).click();
  await page.getByRole("button", { name: /DAY 3/ }).click();
  await expect(page.getByText("Hayabusa 26", { exact: true })).toBeVisible();
  await expect(page.getByText("15:57~17:32", { exact: true })).toBeVisible();
  const link = page.getByRole("link", { name: "Google Maps" }).first();
  expect(await link.getAttribute("href")).toContain("travelmode=walking");
  await menu(page, "준비물");
  const firstCheckbox = page.getByRole("checkbox").first();
  await firstCheckbox.click();
  await expect(firstCheckbox).toBeChecked();
  await menu(page, "예약");
  const apa = page.locator("article").filter({
    has: page.getByRole("heading", {
      name: "APA 호텔 TKP 센다이 에키기타",
      exact: true,
    }),
  });
  await apa.getByRole("button", { name: "수정", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("예약번호", { exact: true })
    .fill("USER-ENTERED-TEST");
  await dialog
    .getByLabel("예약 확인 URL", { exact: true })
    .fill("https://example.com/confirmation");
  await dialog.getByRole("button", { name: "저장", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(apa).toContainText("USER-ENTERED-TEST");
  await menu(page, "지출 / 정산");
  await page.getByRole("button", { name: "지출 / 정산 추가" }).click();
  await dialog.getByLabel("제목 *").fill("테스트 식사");
  await dialog.getByLabel("카테고리 *").fill("음식");
  await dialog.getByLabel("지출액 (엔) *").fill("101");
  await dialog
    .getByLabel("결제자 *")
    .selectOption("11111111-1111-4111-8111-111111111111");
  await dialog.getByRole("button", { name: "저장", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByText("상대에게 보낼 금액 ¥50", { exact: true }),
  ).toBeVisible();
  await page.route("**/api/places?*", (route) =>
    route.fulfill({
      json: route.request().url().includes("q=")
        ? {
            places: [
              {
                id: "fixture-place",
                displayName: { text: "테스트 센다이 식당" },
                formattedAddress: "테스트 주소",
              },
            ],
          }
        : {
            id: "fixture-place",
            displayName: { text: "테스트 센다이 식당" },
            formattedAddress: "테스트 주소",
            rating: 4.5,
          },
    }),
  );
  await page.getByRole("button", { name: "장소", exact: true }).click();
  await page.getByLabel("장소 또는 식당 검색").fill("센다이 테스트");
  await page.getByRole("button", { name: "검색", exact: true }).click();
  await page.getByRole("button", { name: "후보 식당으로 저장" }).click();
  await expect(
    page.getByRole("heading", { name: "테스트 센다이 식당", exact: true }),
  ).toBeVisible();
  const restaurant = page.locator("article").filter({
    has: page.getByRole("heading", {
      name: "테스트 센다이 식당",
      exact: true,
    }),
  });
  await restaurant
    .getByRole("button", { name: "후보 수정 / 방문 선택" })
    .click();
  await dialog
    .getByRole("combobox", { name: "식사 일정", exact: true })
    .selectOption({ label: "2026-12-24 점심 식사" });
  await dialog.getByLabel("실제 방문 식당").check();
  await dialog.getByRole("button", { name: "저장", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(restaurant).toContainText("실제 방문");
  page.once("dialog", (d) => d.accept());
  await restaurant.getByRole("button", { name: "후보 제거" }).click();
  await expect(
    restaurant.getByRole("button", { name: "후보 제거" }),
  ).toHaveCount(0);
  await expect(restaurant).toBeVisible();
  await page.screenshot({ path: "/tmp/senkyo-mobile.png", fullPage: true });
  await menu(page, "설정");
  await page.getByRole("button", { name: "로그아웃", exact: true }).click();
  await expect(page).toHaveURL(/login/);
  expect(
    await page.evaluate(() => sessionStorage.getItem("senkyo-offline")),
  ).toBeNull();
});

test("rejects a stale edit and supports read-only offline snapshots", async ({
  page,
}) => {
  await login(page);
  await menu(page, "메모 / 회고");
  await page.getByRole("button", { name: "메모 / 회고 추가" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("제목 *").fill("공동 메모");
  await dialog
    .getByRole("textbox", { name: "메모 / 회고", exact: true })
    .fill("처음");
  await dialog.getByRole("button", { name: "저장", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await page.getByRole("button", { name: "수정", exact: true }).click();
  await page.evaluate(async () => {
    const data = await (await fetch("/api/data")).json();
    const row = data.notes[0];
    await fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table: "notes",
        id: row.id,
        updated_at: row.updated_at,
        values: { ...row, body: "다른 사용자 수정" },
      }),
    });
  });
  await dialog
    .getByRole("textbox", { name: "메모 / 회고", exact: true })
    .fill("오래된 폼");
  await dialog.getByRole("button", { name: "저장", exact: true }).click();
  await expect(dialog.locator(".error")).toContainText("다른 사용자가 수정");
  await dialog.getByRole("button", { name: "닫기", exact: true }).click();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller)
      await new Promise((resolve) =>
        navigator.serviceWorker.addEventListener("controllerchange", resolve, {
          once: true,
        }),
      );
  });
  await page.context().setOffline(true);
  await page.goto("/network-unavailable");
  await expect(
    page.getByRole("heading", { name: "오프라인 여행정보" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "예약번호", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "저장", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("입력 전", { exact: false }).first(),
  ).toBeVisible();
  await page.context().setOffline(false);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
