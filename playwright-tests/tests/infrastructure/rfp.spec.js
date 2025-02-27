import { test, expect } from "@playwright/test";
import { pauseIfVideoRecording } from "../../testUtils";
import { mockRpcRequest } from "../../util/rpcmock";
import {
  setCacheValue,
  setCommitWritePermissionDontAskAgainCacheValues,
  setDontAskAgainCacheValues,
} from "../../util/cache";
import {
  decodeResultJSON,
  encodeResultJSON,
  mockTransactionSubmitRPCResponses,
} from "../../util/transaction";
const os = require("os");

const isMac = os.platform() === "darwin";
const isLinux = os.platform() === "linux";

async function mockGlobalLabels(page) {
  await mockRpcRequest({
    page,
    filterParams: {
      method_name: "get_global_labels",
    },
    mockedResult: [
      {
        value: "Data Lakes",
        title: "Data Lakes",
        color: [0, 255, 0],
      },
      {
        value: "Explorers",
        title: "Explorers",
        color: [0, 255, 255],
      },
    ],
  });
}

test.afterEach(
  async ({ page }) => await page.unrouteAll({ behavior: "ignoreErrors" })
);

test.describe("Wallet is connected", () => {
  test.use({
    storageState: "playwright-tests/storage-states/wallet-connected.json",
  });
  test("comment links should scroll into view", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto(
      "/infrastructure-committee.near/widget/app?page=rfp&id=1&accountId=trechriron71.near&blockHeight=129808320"
    );
    const viewer = await page.locator("near-social-viewer");
    const commentElement = await viewer.locator(
      "css=div#trechriron71near129808320"
    );
    await expect(commentElement).toBeVisible({ timeout: 30000 });
    await expect(commentElement).toBeInViewport({ timeout: 30000 });
  });
  test("should open RFPs and also search with a query that has no results", async ({
    page,
  }) => {
    await page.goto("/infrastructure-committee.near/widget/app?page=rfps");

    await expect(await page.locator(".content-container")).toContainText("RFP");
    await expect(await page.locator(".rfp-card").first()).toContainText(
      "Submission Deadline"
    );

    await page
      .getByPlaceholder("Search by content")
      .fill("baysyeir77feroiyvbadfa");
    await expect(await page.locator(".rfp-card").first()).not.toBeAttached();
    await expect(await page.locator(".rfp-card").count()).toEqual(0);
    await pauseIfVideoRecording(page);
  });
  test("create RFP button should be hidden for a non admin account", async ({
    page,
  }) => {
    await page.goto("/infrastructure-committee.near/widget/app?page=rfps");
    await expect(await page.locator(".content-container")).toContainText("RFP");
    await expect(await page.locator(".rfp-card").first()).toContainText(
      "Submission Deadline"
    );

    await expect(
      await page.getByPlaceholder("Search by content")
    ).toBeEditable();

    await expect(
      await page.getByRole("button", { name: " Create RFP" })
    ).not.toBeVisible();
  });
});

test.describe("Wallet is connected with admin account", () => {
  test.use({
    storageState: "playwright-tests/storage-states/wallet-connected-admin.json",
  });

  test("should cancel RFP", async ({ page }) => {
    await mockRpcRequest({
      page,
      filterParams: {
        method_name: "get_rfp",
      },
      modifyOriginalResultFunction: async (originalResult) => {
        console.log(JSON.stringify(originalResult, null, 1));
        originalResult.snapshot.timeline.status = "ACCEPTING_SUBMISSIONS";
        originalResult.snapshot.linked_proposals = [];
        return originalResult;
      },
    });

    await page.goto("/infrastructure-committee.near/widget/app?page=rfp&id=0");
    const buttonSelector = `div[data-testid="setting-btn"]`;
    await page.waitForSelector(buttonSelector, {
      state: "visible",
    });
    await page.click(buttonSelector);
    await page.getByRole("button", { name: "Accepting Submissions" }).click();
    await page.getByText("Cancelled", { exact: true }).click();
    await page.getByRole("radio").first().click();
    await page.getByRole("button", { name: "Ready to Cancel" }).click();

    const transactionText = JSON.stringify(
      JSON.parse(await page.locator("div.modal-body code").innerText()),
      null,
      1
    );
    await expect(transactionText).toEqual(
      JSON.stringify(
        {
          id: 0,
          proposals_to_cancel: [],
          proposals_to_unlink: [],
        },
        null,
        1
      )
    );
    await pauseIfVideoRecording(page);
  });
  test("should edit RFP", async ({ page }) => {
    test.setTimeout(120000);
    await mockRpcRequest({
      page,
      filterParams: {
        method_name: "get_rfp",
      },
      modifyOriginalResultFunction: async (originalResult) => {
        console.log(JSON.stringify(originalResult, null, 1));
        originalResult.snapshot.timeline.status = "ACCEPTING_SUBMISSIONS";

        return originalResult;
      },
    });

    await page.goto("/infrastructure-committee.near/widget/app?page=rfp&id=0");
    await page.getByRole("button", { name: "Edit" }).click();
    await page.locator(".badge .bi-trash3-fill").click();
    await page.getByText("Select Category").click();
    await page.getByText("Explorers").click();

    await expect(page.locator(".badge")).toHaveText("Explorers");
    const titleInput = await page.locator('input[type="text"]');
    titleInput.fill("");
    await titleInput.pressSequentially("test edited title");

    const summaryInput = await page.locator('textarea[type="text"]');
    summaryInput.fill("");
    await summaryInput.pressSequentially("the edited rfp summary");

    const descriptionInput = await page
      .frameLocator("iframe")
      .locator(".CodeMirror");
    await descriptionInput.click();
    if (isMac) {
      await descriptionInput.press("Meta+A");
    } else if (isLinux) {
      await descriptionInput.press("Control+A");
    }
    await descriptionInput.press("Backspace");
    await descriptionInput.pressSequentially("The edited RFP description");
    await descriptionInput.blur();

    await page.locator('input[type="date"]').pressSequentially("12/12/2030");

    await pauseIfVideoRecording(page);
    const submitButton = await page.getByRole("button", { name: "Submit" });
    await submitButton.scrollIntoViewIfNeeded();
    await expect(submitButton).toBeEnabled();
    await submitButton.click();
    await pauseIfVideoRecording(page);
    await submitButton.click();

    const transactionText = JSON.stringify(
      JSON.parse(
        await page.locator("div.modal-body code").innerText({ timeout: 10000 })
      ),
      null,
      1
    );
    await expect(transactionText).toEqual(
      JSON.stringify(
        {
          labels: ["Explorers"],
          body: {
            rfp_body_version: "V0",
            name: "test edited title",
            description: "The edited RFP description",
            summary: "the edited rfp summary",
            submission_deadline: "1923264000000000000",
            timeline: {
              status: "ACCEPTING_SUBMISSIONS",
            },
          },
          id: 0,
        },
        null,
        1
      )
    );
  });
});

test.describe("Admin with don't ask again enabled", () => {
  test.use({
    storageState:
      "playwright-tests/storage-states/wallet-connected-with-devhub-access-key.json",
    contextOptions: {
      permissions: ["clipboard-read", "clipboard-write"],
    },
  });
  test("admin should be able to create RFP", async ({ page }) => {
    test.setTimeout(140_000);
    await mockGlobalLabels(page);
    await page.goto("/infrastructure-committee.near/widget/app?page=rfps");
    const title = "test title";
    const summary = "the rfp summary";
    const description = "The RFP description";
    const submissionDate = "12/12/2030";
    const RFPSubmitterAccount = "petersalomonsen.near";
    await setCacheValue({
      page,
      key: JSON.stringify({
        action: "ViewCall",
        contractId: "infrastructure-committee.near",
        methodName: "get_all_rfp_ids",
      }),
      value: [0, 1, 2, 3, 4],
    });
    await setDontAskAgainCacheValues({
      page,
      widgetSrc: "infrastructure-committee.near/widget/components.rfps.Editor",
      methodName: "add_rfp",
      contractId: "infrastructure-committee.near",
    });
    await page.getByRole("button", { name: " Create RFP" }).click();
    await page.getByText("Select Category").click();
    await page.getByText("Explorers").click();
    await expect(page.locator(".badge")).toHaveText("Explorers");
    await page.locator('input[type="text"]').pressSequentially(title);
    await page.locator('input[type="date"]').pressSequentially(submissionDate);
    await page.locator('textarea[type="text"]').pressSequentially(summary);
    const descriptionInput = await page
      .frameLocator("iframe")
      .locator(".CodeMirror");
    await descriptionInput.click();
    await descriptionInput.pressSequentially(description);
    await page.getByRole("checkbox").first().click();

    let newRFPId = 0;
    let get_all_rfps_ids_attempt = 0;
    await mockTransactionSubmitRPCResponses(
      page,
      async ({ route, request, transaction_completed, last_receiver_id }) => {
        const postData = request.postDataJSON();
        if (postData.params?.method_name === "get_all_rfp_ids") {
          const response = await route.fetch();
          const json = await response.json();
          const resultObj = decodeResultJSON(json.result.result);
          json.result.result = encodeResultJSON(resultObj);
          newRFPId = resultObj[resultObj.length - 1] + 1;
          if (transaction_completed) {
            if (get_all_rfps_ids_attempt === 1) {
              resultObj.push(newRFPId);
            } else {
              get_all_rfps_ids_attempt++;
            }
          }
          json.result.result = encodeResultJSON(resultObj);
          await route.fulfill({ response, json });
        } else if (
          postData.params?.method_name === "get_rfp" &&
          postData.params.args_base64 ===
            btoa(JSON.stringify({ rfp_id: newRFPId }))
        ) {
          postData.params.args_base64 = btoa(
            JSON.stringify({ rfp_id: newRFPId - 1 })
          );
          const response = await route.fetch({
            postData: JSON.stringify(postData),
          });
          const json = await response.json();

          let resultObj = decodeResultJSON(json.result.result);
          resultObj = {
            rfp_version: "V0",
            id: newRFPId,
            author_id: RFPSubmitterAccount,
            social_db_post_block_height: "128860426",
            snapshot: {
              editor_id: RFPSubmitterAccount,
              timestamp: "1727265468109441208",
              block_height: "131661163",
              labels: ["Explorers"],
              rfp_body_version: "V0",
              name: title,
              summary: summary,
              description: description,
              timeline: {
                status: "ACCEPTING_SUBMISSIONS",
              },
              submission_deadline: "1728950400000000000",
              linked_proposals: [],
            },
            snapshot_history: [],
          };

          json.result.result = encodeResultJSON(resultObj);

          await route.fulfill({ response, json });
        } else {
          await route.continue();
        }
      }
    );
    const submitButton = await page.getByRole("button", { name: "Submit" });
    await submitButton.scrollIntoViewIfNeeded();
    await expect(submitButton).toBeEnabled();
    await pauseIfVideoRecording(page);
    await submitButton.click();
    expect(submitButton).toBeDisabled();
    const transaction_toast = await page.getByText(
      `Calling contract infrastructure-committee.near with method add_rfp`
    );
    await expect(transaction_toast).toBeVisible();

    await transaction_toast.waitFor({ state: "detached", timeout: 10000 });
    await expect(transaction_toast).not.toBeVisible();

    // check for navigation modal
    const navigationModal = await page.getByText(
      "Your RFP has been successfully published"
    );
    await expect(navigationModal).toBeVisible();
    await page.getByRole("button", { name: "View RFP" }).click();
    await expect(page.url()).toBe(
      `http://localhost:8080/infrastructure-committee.near/widget/app?page=rfp&id=${newRFPId}`
    );

    await pauseIfVideoRecording(page);
  });

  test("should edit RFP", async ({ page }) => {
    test.setTimeout(120000);
    const editRfpId = 0;
    let isTransactionCompleted = false;
    const theNewDescription = "The edited RFP description";

    await mockRpcRequest({
      page,
      filterParams: {
        method_name: "get_rfp",
      },
      modifyOriginalResultFunction: async (originalResult) => {
        if (isTransactionCompleted) {
          originalResult.snapshot.description = theNewDescription;
          originalResult.snapshot.timestamp = (
            BigInt(new Date().getTime()) * BigInt(1_000_000)
          ).toString();
          originalResult.snapshot.block_height += "1";
        }

        return originalResult;
      },
    });

    await mockTransactionSubmitRPCResponses(
      page,
      async ({
        route,
        request,
        transaction_completed,
        last_receiver_id,
        requestPostData,
      }) => {
        isTransactionCompleted = transaction_completed;
        await route.fallback();
      }
    );

    await page.goto(
      `/infrastructure-committee.near/widget/app?page=rfp&id=${editRfpId}`
    );
    await setDontAskAgainCacheValues({
      page,
      widgetSrc: "infrastructure-committee.near/widget/components.rfps.Editor",
      methodName: "edit_rfp",
      contractId: "infrastructure-committee.near",
    });

    await page.getByRole("button", { name: "Edit" }).click();

    const descriptionArea = await page
      .frameLocator("iframe")
      .locator(".CodeMirror textarea");
    await descriptionArea.fill(theNewDescription);
    await descriptionArea.blur();

    await pauseIfVideoRecording(page);
    const submitButton = await page.getByRole("button", { name: "Submit" });
    await submitButton.scrollIntoViewIfNeeded();
    await expect(submitButton).toBeEnabled();
    await pauseIfVideoRecording(page);
    await submitButton.click();
    expect(submitButton).toBeDisabled();
    const transaction_toast = await page.getByText(
      `Calling contract infrastructure-committee.near with method edit_rfp`
    );
    await expect(transaction_toast).toBeVisible();

    await transaction_toast.waitFor({ state: "detached", timeout: 10000 });
    await expect(transaction_toast).not.toBeVisible();

    // check for navigation modal
    const navigationModal = await page.getByText(
      "Your RFP has been successfully edited"
    );
    await expect(navigationModal).toBeVisible();
    await page.getByRole("button", { name: "View RFP" }).click();
    await expect(page.url()).toBe(
      `http://localhost:8080/infrastructure-committee.near/widget/app?page=rfp&id=${editRfpId}`
    );

    await pauseIfVideoRecording(page);
  });

  test("should paste a comment to a rfp, see that the comment appears after submission, and that the comment field is cleared, even after reloading the page", async ({
    page,
  }) => {
    test.setTimeout(2 * 60000);
    await page.goto(`/infrastructure-committee.near/widget/app?page=rfp&id=1`);
    const widgetSrc =
      "infrastructure-committee.near/widget/components.molecule.ComposeComment";

    page.waitForTimeout(20_000);
    let commentButton = await page.getByRole("button", { name: "Comment" });
    await expect(commentButton).toBeAttached({ timeout: 30_000 });
    await commentButton.scrollIntoViewIfNeeded();

    const commentText = "I'm testing again now.";

    await page.evaluate(async (text) => {
      await navigator.clipboard.writeText(text);
    }, commentText);

    const commentArea = await page
      .frameLocator("iframe")
      .last()
      .locator(".CodeMirror textarea");
    await commentArea.focus();
    await expect(commentArea).toBeFocused();
    await page.waitForTimeout(100);

    const isMac = process.platform === "darwin";

    if (isMac) {
      await page.keyboard.down("Meta"); // Command key on macOS
      await page.keyboard.press("a");
      await page.keyboard.press("v");
      await page.keyboard.up("Meta");
    } else {
      await page.keyboard.down("Control"); // Control key on Windows/Linux
      await page.keyboard.press("a");
      await page.keyboard.press("v");
      await page.keyboard.up("Control");
    }

    await commentArea.blur();
    await pauseIfVideoRecording(page);

    const userAccount = "petersalomonsen.near";
    await setCommitWritePermissionDontAskAgainCacheValues({
      page,
      widgetSrc,
      accountId: userAccount,
    });

    const transactionMockStatus = await mockTransactionSubmitRPCResponses(
      page,
      async ({ route, request, transaction_completed, last_transaction }) => {
        const postData = request.postDataJSON();
        const args_base64 = postData.params?.args_base64;

        if (transaction_completed && args_base64) {
          const args = atob(args_base64);
          if (
            postData.params.account_id === "social.near" &&
            postData.params.method_name === "get" &&
            args === `{"keys":["${userAccount}/post/**"]}`
          ) {
            const response = await route.fetch();
            const json = await response.json();
            const resultObj = decodeResultJSON(json.result.result);

            resultObj[userAccount].post.main = JSON.stringify({
              text: commentText,
            });
            json.result.result = encodeResultJSON(resultObj);
            completedPromiseResolve(last_transaction);
            await route.fulfill({ response, json });
            return;
          } else {
            await route.continue();
          }
        } else {
          await route.continue();
        }
      }
    );

    let submittedTransactionJsonObjectPromiseResolve;
    let submittedTransactionJsonObjectPromise = new Promise(
      (r) => (submittedTransactionJsonObjectPromiseResolve = r)
    );
    await page.route("https://api.near.social/index", async (route) => {
      if (transactionMockStatus.transaction_completed) {
        const lastTransactionParamBuffer = Buffer.from(
          transactionMockStatus.last_transaction.params[0],
          "base64"
        );

        const transactionDataJsonStartIndex =
          lastTransactionParamBuffer.indexOf('{"data":');
        const transactionDataJsonEndIndex =
          lastTransactionParamBuffer.indexOf('"}}}}') + '"}}}}'.length;
        const transactionDataJsonString = lastTransactionParamBuffer.subarray(
          transactionDataJsonStartIndex,
          transactionDataJsonEndIndex
        );

        submittedTransactionJsonObjectPromiseResolve(
          JSON.parse(transactionDataJsonString.toString())
        );

        const response = await route.fetch();
        const json = await response.json();
        json.push({
          accountId: userAccount,
          blockHeight: 129162427,
          value: {
            type: "md",
          },
        });

        await route.fulfill({ json });
      } else {
        await route.continue();
      }
    });

    commentButton = await page.getByRole("button", { name: "Comment" });
    await commentButton.click();

    const loadingIndicator = await page.locator(".comment-btn-spinner");
    await expect(loadingIndicator).toBeAttached();
    await loadingIndicator.waitFor({ state: "detached", timeout: 30000 });
    await expect(loadingIndicator).not.toBeVisible();
    const transaction_successful_toast = await page.getByText(
      "Comment Submitted Successfully",
      { exact: true }
    );
    await expect(transaction_successful_toast).toBeVisible();

    await expect(transaction_successful_toast).not.toBeAttached({
      timeout: 10000,
    });
    await expect(
      await page.frameLocator("iframe").last().locator(".CodeMirror")
    ).not.toContainText(commentText);
    await expect(
      await page.frameLocator("iframe").last().locator(".CodeMirror")
    ).toContainText("Add your comment here...");

    const submittedTransactionJsonObject =
      await submittedTransactionJsonObjectPromise;
    const submittedComment = JSON.parse(
      submittedTransactionJsonObject.data["petersalomonsen.near"].post.comment
    );
    expect(submittedComment.text).toEqual(commentText);
    let commentElement = await page.locator("#petersalomonsennear129162427");
    await expect(commentElement).toBeVisible({ timeout: 30_000 });
    await expect(commentElement).toContainText(commentText, {
      timeout: 30_000,
    });

    await page.reload();

    commentElement = await page.locator("#petersalomonsennear129162427");
    await expect(commentElement).toBeVisible({ timeout: 30_000 });
    await expect(commentElement).toContainText(commentText, {
      timeout: 30_000,
    });

    commentButton = await page.getByRole("button", { name: "Comment" });
    await expect(commentButton).toBeAttached({ timeout: 20000 });
    await commentButton.scrollIntoViewIfNeeded();

    // Ensure that comment field is not populated with the previous draft, even after 5 seconds
    await page.waitForTimeout(5000);

    await expect(
      await page.frameLocator("iframe").last().locator(".CodeMirror")
    ).toContainText("Add your comment here...");

    await pauseIfVideoRecording(page);
  });
});
