import React, { useEffect, useState } from "react";
import csvToJson from "csvtojson";
import "./Table.css";
import Marquee from "react-fast-marquee";
import { AutopartForm } from "../autopartForm/AutopartForm";

const URL =
  "https://docs.google.com/spreadsheets/d/e/" +
  process.env.REACT_APP_SHEET_ID +
  "/pub?output=csv";

export const Table = () => {
  interface ApiData {
    артикул: string;
    описание: string;
    category: string;
    "кол-во": string;
    ц: string;
    аналоги: string;
    sale: string;
    auto: string;
  }

  interface ApiAdditioanlData {
    courses: string;
    text: string;
  }

  interface BankData {
    Cur_ID: number;
    Date: string;
    Cur_Abbreviation: string;
    Cur_Scale: number;
    Cur_Name: string;
    Cur_OfficialRate: number;
  }

  const [data, setData] = useState<Array<ApiData>>();
  const [filteredData, setFilteredData] = useState<Array<ApiData>>();
  const [selectedCategories, setSelectedCategories] = useState<Array<string>>(
    []
  );
  const [categories, setCategories] = useState<Array<string>>([]);
  const [autoMarks, setAutoMarks] = useState<Array<string>>([]);
  const [showFiltersCheckbox, setShowFiltersCheckbox] =
    useState<boolean>(false);
  const [sale, setSale] = useState<boolean>(false);
  const [markdown, setMarkdown] = useState<boolean>(false);
  const [currency, setCurrency] = useState<BankData>();
  const [courses, setCourses] = useState<string>();
  const [adText, setAdText] = useState<string>();
  const [showProductForm, setShowProductForm] = useState<boolean>(false);

  type StockOption = "акция" | "уценка";

  const loadDataFromSheet = async (URL: string) => {
    const dataUrl = await fetch(URL);
    const res = await dataUrl.text();
    const json: Array<ApiData> = await csvToJson().fromString(res);

    setData(json);
    setFilteredData(json);
    setCategories(getAllCategories(json));
    setAutoMarks(getAllAutoMarks(json));

    const additionalJson: Array<ApiAdditioanlData> =
      await csvToJson().fromString(res);
    setCourses(additionalJson[0].courses);
    setAdText(additionalJson[0].text);
  };

  const categoriesChangeHandle = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const category = event.target.value;

    setSale(false);
    setMarkdown(false);

    event.target.checked
      ? selectedCategories.push(category)
      : selectedCategories.splice(selectedCategories.indexOf(category), 1);

    selectedCategories.length === 0
      ? setFilteredData(data)
      : setFilteredData(
          data?.filter((item) => {
            const selectedAutoMarks = selectedCategories.find((cat) =>
              autoMarks.includes(cat)
            );
            const selectedCats = selectedCategories.find((cat) =>
              categories.includes(cat)
            );

            const res = selectedCats
              ? selectedAutoMarks
                ? selectedCategories.includes(item.category) &&
                  selectedCategories.includes(item.auto)
                : selectedCategories.includes(item.category)
              : selectedCategories.includes(item.auto) 

            return res;
          })
        );
  };

  const searchHandle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const text = event.target.value;

    selectedCategories.length === 0
      ? setFilteredData(data?.filter((item) => searchTextInObject(text, item)))
      : setFilteredData(
          data?.filter(
            (item) =>
              searchTextInObject(text, item) &&
              selectedCategories.includes(item.category)
          )
        );
  };

  const searchTextInObject = (text: string, item: ApiData): boolean => {
    for (let value of Object.values(item)) {
      const field = value.toLowerCase().replaceAll(/[/,.-\s]/g, "");
      const textToSearch = text.toLowerCase().replaceAll(/[/,.-\s]/g, "");
      if (field.includes(textToSearch)) {
        return true;
      }
    }

    return false;
  };

  const getAllCategories = (data: Array<ApiData>) => {
    const allCategories: Array<string> = [];

    data.forEach((item) => {
      const itemCategory = item.category;
      if (!allCategories.includes(itemCategory) && itemCategory.length !== 0) {
        allCategories.push(itemCategory);
      }
    });

    return allCategories;
  };

  const getAllAutoMarks = (data: Array<ApiData>) => {
    const allCategories: Array<string> = [];

    data.forEach((item) => {
      const itemCategory = item.auto;
      if (!allCategories.includes(itemCategory) && itemCategory.length !== 0) {
        allCategories.push(itemCategory);
      }
    });

    return allCategories;
  };

  const pageHandler = (event: React.MouseEvent<HTMLElement>) => {
    if (!showFiltersCheckbox) {
      return;
    }

    if (event.target instanceof Element) {
      const classClicked = event.target.className;

      if (
        classClicked !== "messageCheckbox" &&
        classClicked !== "categories" &&
        classClicked !== "categoryLabel"
      ) {
        setShowFiltersCheckbox(false);
      }
    }
  };

  const onStockHandle = (stockOption: StockOption) => {
    let newStockValue;

    if (stockOption === "акция") {
      setSale(!sale);
      newStockValue = sale;
      setMarkdown(false);
    } else {
      setMarkdown(!markdown);
      newStockValue = markdown;
      setSale(false);
    }

    selectedCategories.length === 0
      ? newStockValue
        ? setFilteredData(data)
        : setFilteredData(
            data?.filter((item) => searchTextInObject(stockOption, item))
          )
      : newStockValue
      ? setFilteredData(
          data?.filter((item) => selectedCategories.includes(item.category))
        )
      : setFilteredData(
          data?.filter(
            (item) =>
              selectedCategories.includes(item.category) &&
              searchTextInObject(stockOption, item)
          )
        );
  };

  const loadCurrencyFromBank = async () => {
    const data = await fetch("https://www.nbrb.by/api/exrates/rates/431");
    setCurrency(await data.json());
  };

  const getRublePrice = (price: string): number => {
    price = price.replace(",", ".");

    if (!isNaN(+price) && currency) {
      return +price * (currency.Cur_OfficialRate + +courses!);
    }

    return 0
  }

  const onOrderHandler = () => {
    setShowProductForm(!showProductForm)
    alert('Вы можете запросить цену на интересующий вас товар,\nдоставка 2-14 дней, после согласования цены.')
  }

  useEffect(() => {
    loadDataFromSheet(URL)
    loadCurrencyFromBank()
    setTimeout(() => {
      window.location.reload();
    }, 1800000)
  }, [])

  return (
    <section onClick={(event) => pageHandler(event)}>
      <header className="header">
        <div className="infoBlock">
          <input
            className="searchInput"
            onChange={searchHandle}
            placeholder="Search..."
          />
          <div>
            <button
              className="categoriesButton"
              onClick={() => setShowFiltersCheckbox(!showFiltersCheckbox)}
              style={{
                backgroundColor:
                  selectedCategories.length !== 0 ? "yellow" : "white",
              }}
            >
              {showFiltersCheckbox ? "CLOSE" : "FILTER"}
            </button>
            <button
              className={`salesButton ${sale && "saleSuccess"}`}
              onClick={() => onStockHandle("акция")}
            >
              Акции
            </button>
            <button
              className={`salesButton ${markdown && "saleSuccess"}`}
              onClick={() => onStockHandle("уценка")}
            >
              Уценка
            </button>
            <div
              className="filtering"
              style={{ display: showFiltersCheckbox ? "block" : "none" }}
            >
              <div className="categoriesContainer">
                <div className="categories">
                  {categories.map((category) => (
                    <label className="categoryLabel">
                      <input
                        className="messageCheckbox"
                        type="checkbox"
                        value={category}
                        name="categories"
                        onChange={categoriesChangeHandle}
                      />
                      {category}
                    </label>
                  ))}
                </div>
                <div className="categories">
                  {autoMarks.map((autoMark) => (
                    <label className="categoryLabel">
                      <input
                        className="messageCheckbox"
                        type="checkbox"
                        value={autoMark}
                        name="categories"
                        onChange={categoriesChangeHandle}
                      />
                      {autoMark}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <AutopartForm show={showProductForm} className='autoPartForm' onClose={() => setShowProductForm(false)}/>
        <button className='orderButton' onClick={onOrderHandler}>Заказать</button>
        <span>
          {currency && (currency.Cur_OfficialRate + +courses!).toFixed(2)}
        </span>
      </header>
      <div className="section">
        <table className="table">
          <thead>
            <tr>
              <th>артикул</th>
              <th>описание</th>
              <th>кол-во</th>
              <th>ц</th>
            </tr>
          </thead>
          <tbody>
            {filteredData?.map((item) => (
              <tr>
                <td>{item["артикул"]}</td>
                <td>{item["описание"]}</td>
                <td>{item["кол-во"]}</td>
                <td>
                  {item["ц"]}{" "}
                  {item["ц"] && (
                    <span className="rublePrice">
                      / {getRublePrice(item["ц"]).toFixed(1)}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="marquee">
        <Marquee speed={60} pauseOnHover={true}>
          {adText}
        </Marquee>
      </div>
    </section>
  );
};
