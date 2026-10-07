import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
const captures = process.env.SENKYO_SCREENSHOT_DIR ?? "test-results/renewal";
mkdirSync(captures, { recursive: true });
async function login(page: Page, username = "fixture_a") {
  await page.goto("/login");
  await page.getByLabel("아이디", { exact: true }).fill(username);
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
async function tab(page: Page, name: string) {
  await page
    .getByRole("navigation")
    .getByRole("button", { name, exact: true })
    .click();
}
async function menu(page: Page, name: string) {
  await tab(page, "더보기");
  await page.getByRole("button", { name, exact: true }).click();
}
async function day(page: Page, n: number) {
  await page.getByRole("button", { name: new RegExp(`DAY ${n}`) }).click();
}
async function detail(page: Page, title: string, button = "일정 상세") {
  const row = page
    .locator("article")
    .filter({ has: page.getByRole("heading", { name: title, exact: true }) });
  await row.getByRole("button", { name: button, exact: true }).click();
  return page.getByRole("dialog");
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}
test.beforeEach(async ({ page, request }) => {
  await request.post("http://127.0.0.1:3101/test/reset");
  await page.route("https://maps.googleapis.com/**", (route) => route.abort());
});

test("authentication and direct removed write paths remain protected", async ({
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
  expect((await request.get("/api/data")).status()).toBe(403);
  expect((await request.get("/api/places?id=test")).status()).toBe(401);
  await login(page);
  for (const table of [
    "schedule_items",
    "places",
    "meal_candidates",
    "expenses",
    "schedule_places",
    "transport_segments",
  ]) {
    const response = await page.request.post("/api/data", {
      headers: { Origin: "http://127.0.0.1:3100" },
      data: { table, values: {} },
    });
    expect(response.ok()).toBe(false);
  }
  expect(
    (await page.request.post("/api/schedule-order", { data: {} })).status(),
  ).toBe(404);
  const data = await (await page.request.get("/api/data")).json();
  expect(data.expenses).toBeUndefined();
  expect(data.expense_splits).toBeUndefined();
  expect(data.meal_candidates).toBeUndefined();
  expect((await page.request.get("/api/places?q=Tokyo")).status()).toBe(400);
  await menu(page, "설정");
  await page.getByRole("button", { name: "로그아웃", exact: true }).click();
  await expect(page).toHaveURL(/login/);
  expect(
    await page.evaluate(() => sessionStorage.getItem("senkyo-offline")),
  ).toBeNull();
});

test("r3 timeline, hotels and fixed restaurant links preserve unresolved branches", async ({
  page,
}) => {
  await login(page);
  await tab(page, "일정");
  await day(page, 2);
  await expect(
    page.getByRole("heading", {
      name: "센다이 우미노모리 수족관 관람",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText("10:00~13:00", { exact: true })).toBeVisible();
  await expect(page.getByText(/아라하마/)).toHaveCount(0);
  let panel = await detail(
    page,
    "하카타 모츠나베 오오야마 센다이점 점심",
    "식당 보기",
  );
  const map = panel.getByRole("link", { name: /지도 보기/ });
  expect(
    new URL((await map.getAttribute("href"))!).searchParams.get("api"),
  ).toBe("1");
  await panel.getByRole("button", { name: "닫기", exact: true }).click();
  await day(page, 3);
  panel = await detail(page, "仙台中華そば 銘店嘉一 本店", "식당 보기");
  await expect(
    panel.getByText("仙台中華そば 銘店嘉一 本店", { exact: true }),
  ).toHaveCount(2);
  await panel.getByRole("button", { name: "닫기", exact: true }).click();
  await day(page, 4);
  panel = await detail(page, "KOMEDA’S Coffee 아침", "식당 보기");
  await expect(
    panel.getByText(/식당 지점 또는 식사 위치 확인 필요/),
  ).toBeVisible();
  await expect(panel.getByRole("link", { name: /지도 보기/ })).toHaveCount(0);
  await panel.getByRole("button", { name: "닫기", exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: /일정 추가|순서 편집|후보|지점 연결|이동 수정/,
    }),
  ).toHaveCount(0);
  await noOverflow(page);
});

test("daily preparation stays in a sheet, preserves location and separates carry dates", async ({
  page,
}) => {
  await login(page);
  await day(page, 3);
  const open = page.getByRole("button", { name: "준비물 전체", exact: true });
  await open.scrollIntoViewIfNeeded();
  const scroll = await page.evaluate(() => scrollY);
  await open.click();
  const panel = page.getByRole("dialog");
  await expect(panel).toHaveAttribute(
    "aria-label",
    "2026-12-24 · 오늘의 준비 전체보기",
  );
  const phone = panel
    .locator(".preparation-row")
    .filter({ has: page.getByText("휴대전화", { exact: true }) })
    .filter({ has: page.getByText(/테스트 A · 오늘 휴대함/) });
  await phone.getByRole("checkbox").check();
  await expect(phone.getByRole("checkbox")).toBeChecked();
  await panel.getByRole("button", { name: "미완료", exact: true }).click();
  const first = panel.getByRole("checkbox").first();
  await first.check();
  await expect(first).toBeVisible();
  await expect(first).toBeChecked();
  await panel.getByRole("button", { name: "할 일", exact: true }).click();
  await expect(
    panel.getByRole("button", { name: "할 일", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Tab");
  expect(
    await panel.evaluate((el) => el.contains(document.activeElement)),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(panel).toHaveCount(0);
  expect(await page.evaluate(() => scrollY)).toBe(scroll);
  await expect(open).toBeFocused();
  await expect(page.getByRole("button", { name: /DAY 3/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await day(page, 4);
  await open.click();
  const nextPhone = page
    .getByRole("dialog")
    .locator(".preparation-row")
    .filter({ has: page.getByText("휴대전화", { exact: true }) })
    .filter({ has: page.getByText(/테스트 A · 오늘 휴대함/) });
  await expect(nextPhone.getByRole("checkbox")).not.toBeChecked();
  await page.screenshot({
    path: `${captures}/after-preparation-sheet.png`,
    fullPage: false,
    animations: "disabled",
  });
});

test("daily preparation restores the check and keeps an error when saving fails", async ({
  page,
}) => {
  await login(page);
  await page.getByRole("button", { name: "준비물 전체", exact: true }).click();
  const panel = page.getByRole("dialog");
  const checkbox = panel.getByRole("checkbox").first();
  await expect(checkbox).toBeEnabled();
  let release!: () => void;
  const blocked = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/data", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    await blocked;
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "테스트 저장 실패" }),
    });
  });
  await checkbox.check();
  await expect(checkbox).toBeChecked();
  release();
  await expect(checkbox).not.toBeChecked();
  await expect(panel.getByRole("alert")).toContainText("테스트 저장 실패");
  await expect(panel).toBeVisible();
});

test("PRE_TRIP remains once-only and schedule preparation supports add/edit/check/delete", async ({
  page,
}) => {
  await login(page);
  await tab(page, "준비");
  await page
    .getByRole("button", { name: "여행 전 할 일 추가", exact: true })
    .click();
  let panel = page.getByRole("dialog");
  await panel.getByLabel("제목 *", { exact: true }).fill("출발 전 테스트 확인");
  await panel.getByRole("button", { name: "저장", exact: true }).click();
  await expect(panel).toHaveCount(0);
  let task = page
    .locator(".preparation-row")
    .filter({ has: page.getByText("출발 전 테스트 확인", { exact: true }) });
  await task.getByRole("checkbox").check();
  await expect(task.getByRole("checkbox")).toBeChecked();
  await tab(page, "오늘");
  await page
    .getByRole("button", { name: "체크리스트 전체", exact: true })
    .click();
  panel = page.getByRole("dialog");
  await expect(
    panel.getByText("출발 전 테스트 확인", { exact: true }),
  ).toHaveCount(0);
  await panel.getByRole("button", { name: "닫기", exact: true }).click();
  await tab(page, "일정");
  await day(page, 2);
  panel = await detail(page, "센다이 우미노모리 수족관 관람");
  await panel.getByRole("button", { name: "준비물 추가", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await panel.getByLabel("준비물 *", { exact: true }).fill("사용자 방수 가방");
  await panel.getByRole("button", { name: "저장", exact: true }).click();
  task = panel
    .locator(".preparation-row")
    .filter({ has: page.getByText("사용자 방수 가방", { exact: true }) });
  await task.getByRole("checkbox").check();
  await expect(task.getByRole("checkbox")).toBeChecked();
  await task.getByRole("button", { name: "수정", exact: true }).click();
  await panel
    .getByLabel("준비물 *", { exact: true })
    .fill("사용자 작은 방수 가방");
  await panel.getByRole("button", { name: "저장", exact: true }).click();
  await expect(
    panel.getByText("사용자 작은 방수 가방", { exact: true }),
  ).toBeVisible();
  page.once("dialog", (d) => d.accept());
  await panel
    .locator(".preparation-row")
    .filter({ has: page.getByText("사용자 작은 방수 가방", { exact: true }) })
    .getByRole("button", { name: "삭제", exact: true })
    .click();
  await expect(
    panel.getByText("사용자 작은 방수 가방", { exact: true }),
  ).toHaveCount(0);
});

test("moving schedule handles multiple reservations and private text/file/mixed materials", async ({
  page,
  request,
}) => {
  await login(page);
  await tab(page, "일정");
  await day(page, 3);
  const panel = await detail(page, "아키우 대폭포 이동·도착", "예약자료 보기");
  await panel.getByLabel("새 이동자료 제목").fill("아키우 버스 시각표");
  await panel
    .getByRole("button", { name: "자료 추가하기", exact: true })
    .click();
  await expect(
    panel.getByText("비예약 이동자료", { exact: true }).first(),
  ).toBeVisible();
  await panel.getByLabel("텍스트 제목", { exact: true }).fill("버스 안내");
  await panel
    .getByLabel("첨부 텍스트", { exact: true })
    .fill("<script>alert(1)</script> 실제 안내 텍스트");
  await panel
    .getByRole("button", { name: "텍스트 첨부 저장", exact: true })
    .click();
  await expect(
    panel.getByText("<script>alert(1)</script> 실제 안내 텍스트", {
      exact: true,
    }),
  ).toBeVisible();
  await panel.getByLabel("파일 제목", { exact: true }).fill("버스 PDF");
  await panel.getByLabel("파일 설명", { exact: true }).fill("출발 위치 확인");
  await panel
    .getByLabel("파일과 함께 저장할 텍스트", { exact: true })
    .fill("환승 안내");
  await panel.getByLabel("확인서 파일 (최대 10MB)").setInputFiles({
    name: "test.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4 test"),
  });
  await panel.getByRole("button", { name: "첨부 업로드", exact: true }).click();
  await expect(panel.getByText("환승 안내", { exact: true })).toBeVisible();
  await expect(
    panel.getByText("출발 위치 확인", { exact: true }),
  ).toBeVisible();
  const state = await (
    await request.get("http://127.0.0.1:3101/test/data")
  ).json();
  expect(state.objectCount).toBe(1);
  const file = state.data.reservation_attachments.find(
    (a: { file_name: string }) => a.file_name === "버스 PDF",
  );
  expect(file.text_content).toBe("환승 안내");
  const url1 = await (
    await page.request.get(`/api/attachments?id=${file.id}`)
  ).json();
  const url2 = await (
    await page.request.get(`/api/attachments?id=${file.id}`)
  ).json();
  expect(url1.url).not.toBe(url2.url);
  await panel
    .getByRole("button", { name: "일정으로 돌아가기", exact: true })
    .click();
  await panel
    .getByRole("combobox", { name: "기존 예약 연결", exact: true })
    .selectOption({ label: "Hayabusa 26" });
  await panel
    .getByRole("button", { name: "기존 자료 연결", exact: true })
    .click();
  await expect(
    panel.getByRole("heading", { name: "Hayabusa 26", exact: true }),
  ).toBeVisible();
  await panel
    .getByRole("button", { name: "일정으로 돌아가기", exact: true })
    .click();
  await expect(
    panel.getByRole("button", { name: /아키우 버스 시각표/ }),
  ).toBeVisible();
  await expect(
    panel.getByRole("button", { name: /Hayabusa 26/ }),
  ).toBeVisible();
  await page.screenshot({
    path: `${captures}/after-travel-materials.png`,
    fullPage: false,
    animations: "disabled",
  });
});

test("attachment failure keeps error and cleans uploaded object after DB failure", async ({
  page,
  request,
}) => {
  await login(page);
  await menu(page, "예약자료");
  const card = page.locator("article").filter({
    has: page.getByRole("heading", {
      name: "APA 호텔 TKP 센다이 에키기타",
      exact: true,
    }),
  });
  await card.getByRole("button", { name: "자료 보기", exact: true }).click();
  const panel = page.getByRole("dialog");
  await panel.getByLabel("확인서 파일 (최대 10MB)").setInputFiles({
    name: "bad.png",
    mimeType: "image/png",
    buffer: Buffer.from("not a png"),
  });
  await panel.getByRole("button", { name: "첨부 업로드", exact: true }).click();
  await expect(panel.getByRole("alert")).toContainText("파일 형식이나 크기");
  await request.post("http://127.0.0.1:3101/test/fail-attachment");
  await panel.getByLabel("확인서 파일 (최대 10MB)").setInputFiles({
    name: "valid.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-fixture"),
  });
  await panel.getByRole("button", { name: "첨부 업로드", exact: true }).click();
  await expect(panel.getByRole("alert")).toContainText("첨부정보 저장에 실패");
  expect(
    (await (await request.get("http://127.0.0.1:3101/test/data")).json())
      .objectCount,
  ).toBe(0);
  await page.screenshot({
    path: `${captures}/after-attachment-error.png`,
    fullPage: false,
    animations: "disabled",
  });
});

test("stale reservation forms reject and allow reopening without overwriting another user", async ({
  page,
  request,
}) => {
  await login(page);
  await menu(page, "예약자료");
  const card = page.locator("article").filter({
    has: page.getByRole("heading", {
      name: "APA 호텔 TKP 센다이 에키기타",
      exact: true,
    }),
  });
  await card.getByRole("button", { name: "자료 보기", exact: true }).click();
  const panel = page.getByRole("dialog");
  await panel.getByRole("button", { name: "예약 수정", exact: true }).click();
  await panel.getByLabel("예약번호", { exact: true }).fill("MY-STALE-NUMBER");
  const state = await (
    await request.get("http://127.0.0.1:3101/test/data")
  ).json();
  const row = state.data.reservations.find(
    (r: { title: string }) => r.title === "APA 호텔 TKP 센다이 에키기타",
  );
  await request.patch(
    `http://127.0.0.1:3101/rest/v1/reservations?id=eq.${row.id}`,
    {
      headers: { Authorization: "Bearer " + (await fixtureToken(page)) },
      data: { reservation_number: "OTHER-USER-NUMBER" },
    },
  );
  await panel.getByRole("button", { name: "저장", exact: true }).click();
  await expect(panel.getByRole("alert").first()).toContainText(
    "다른 사용자가 수정",
  );
  expect(
    (
      await (await request.get("http://127.0.0.1:3101/test/data")).json()
    ).data.reservations.find((r: { id: string }) => r.id === row.id)
      .reservation_number,
  ).toBe("OTHER-USER-NUMBER");
  await panel.getByRole("button", { name: "작성 취소", exact: true }).click();
  await panel.getByRole("button", { name: "예약 수정", exact: true }).click();
  await expect(panel.getByLabel("예약번호", { exact: true })).toHaveValue(
    "OTHER-USER-NUMBER",
  );
  const longNumber = "USER-INPUT-" + "0123456789".repeat(60);
  await panel.getByLabel("예약번호", { exact: true }).fill(longNumber);
  await panel.getByRole("button", { name: "저장", exact: true }).click();
  await expect(panel.getByText(longNumber)).toBeVisible();
  expect(await panel.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true,
  );
  await noOverflow(page);
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await panel
    .getByRole("button", { name: "예약번호 복사", exact: true })
    .click();
  await expect(panel.getByRole("status")).toHaveText("예약번호를 복사했습니다");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    longNumber,
  );
});
async function fixtureToken(page: Page) {
  const cookies = await page.context().cookies();
  const parts = cookies
    .filter((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((c) => c.value)
    .join("");
  return JSON.parse(
    Buffer.from(parts.replace(/^base64-/, ""), "base64url").toString(),
  ).access_token;
}

test("two distinct accounts synchronize shared checks through periodic refresh", async ({
  page,
  browser,
}) => {
  await login(page);
  const context = await browser.newContext({
    viewport: { width: 320, height: 740 },
  });
  const other = await context.newPage();
  await other.route("https://maps.googleapis.com/**", (r) => r.abort());
  await other.clock.install();
  await login(other, "fixture_b");
  await page
    .getByRole("button", { name: "체크리스트 전체", exact: true })
    .click();
  await other
    .getByRole("button", { name: "체크리스트 전체", exact: true })
    .click();
  const first = page.getByRole("dialog").getByRole("checkbox").first();
  const shared = other.getByRole("dialog").getByRole("checkbox").first();
  await first.check();
  await expect(first).toBeChecked();
  await expect(first).toBeEnabled();
  await other.clock.fastForward(31000);
  await expect(shared).toBeChecked();
  await context.close();
});

test("map failure and auth failure preserve external links without invented markers", async ({
  page,
}) => {
  await login(page);
  await tab(page, "지도");
  await expect(page.locator(".error[role=alert]")).toContainText(
    "지도를 불러오지 못했습니다",
  );
  await expect(page.getByText(/Google 지점이 아직 연결되지/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: /검색|지점 연결/ }),
  ).toHaveCount(0);
  expect(
    await page.getByRole("link", { name: /지도 보기/ }).count(),
  ).toBeGreaterThan(0);
  await page.evaluate(() => window.gm_authFailure?.());
  await expect(page.locator(".error[role=alert]")).toContainText(
    "Google 지도 인증 실패",
  );
  expect(
    await page.getByRole("link", { name: /지도 보기/ }).count(),
  ).toBeGreaterThan(0);
  await page.screenshot({
    path: `${captures}/after-map-fallback.png`,
    fullPage: true,
  });
});

test("offline snapshot is read-only and excludes archived current plans", async ({
  page,
}) => {
  await login(page);
  await page.goto("/offline");
  await expect(
    page.getByRole("heading", { name: "오프라인 여행정보" }),
  ).toBeVisible();
  await expect(page.getByText(/대구공항 도착/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: /저장|수정|추가/ }),
  ).toHaveCount(0);
});

test("winter screens and sheets fit 320/390/768/1280px and enlarged text", async ({
  page,
}) => {
  await login(page);
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await noOverflow(page);
    await tab(page, "오늘");
    await day(page, 1);
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({
      path: `${captures}/after-today-${width}.png`,
      fullPage: true,
    });
    await tab(page, "일정");
    await day(page, 3);
    const panel = await detail(page, "仙台中華そば 銘店嘉一 本店", "식당 보기");
    expect(await panel.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
      true,
    );
    await noOverflow(page);
    await page.screenshot({
      path: `${captures}/after-schedule-sheet-${width}.png`,
      fullPage: false,
      animations: "disabled",
    });
    await panel.getByRole("button", { name: "닫기", exact: true }).click();
  }
  await page.setViewportSize({ width: 320, height: 740 });
  await tab(page, "오늘");
  await day(page, 1);
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: `${captures}/after-today-baseline.png` });
  await page.setViewportSize({ width: 390, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addStyleTag({ content: "body{font-size:200%}" });
  await tab(page, "오늘");
  await noOverflow(page);
});

test("before/during/after labels and backdrops maintain context", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-06T00:00:00Z") });
  await login(page);
  await expect(page.getByText(/여행까지 D-/)).toBeVisible();
  await page.clock.setSystemTime(new Date("2026-12-22T00:00:00Z"));
  await page.clock.fastForward(31000);
  await expect(
    page.getByText("일본 현지시간 · 오늘의 여행", { exact: true }),
  ).toBeVisible();
  await page.clock.setSystemTime(new Date("2026-12-28T00:00:00Z"));
  await page.clock.fastForward(31000);
  await expect(page.getByText(/여행을 마쳤어요/)).toBeVisible();
  await page
    .getByRole("button", { name: "체크리스트 전체", exact: true })
    .click();
  const panel = page.getByRole("dialog");
  await page.mouse.click(4, 4);
  await expect(panel).toHaveCount(0);
});
