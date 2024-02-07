/**
 * @jest-environment jsdom
 */

import { screen } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js";
import userEvent from "@testing-library/user-event";

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then I can enter informations in the form's inputs", async () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      //to-do write assertion
      const newBillDisplay = screen.getByTestId("form-new-bill");

      await waitFor(() => newBillDisplay);

      expect(newBillDisplay).toBeTruthy();
    });

    test("Then I verify the file property", () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const store = null;
      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });
      const fileTest = new File(["hello"], "hello.png", { type: "image/png" });
      const handleChangeFile = jest.spyOn(newBill, "handleChangeFile");
      const fileInput = screen.getAllByTestId("file");
      userEvent.upload(fileInput, fileTest);

      expect(handleChangeFile).toBeTruthy();
    });
  });
});
