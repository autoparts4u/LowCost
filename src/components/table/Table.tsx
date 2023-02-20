import React, { useEffect, useState } from 'react'
import csvToJson from 'csvtojson'
import './Table.css'

const URL = 'https://docs.google.com/spreadsheets/d/e/' + process.env.REACT_APP_SHEET_ID + '/pub?output=csv';

export const Table = () => {
  
  interface ApiData {
    "артикул": string
    "описание": string
    "category": string
    "кол-во": string
    "ц": string
    "аналоги": string
    "sale": string
  }

  interface BankData {
    Cur_ID: number,
    Date: string,
    Cur_Abbreviation: string,
    Cur_Scale: number,
    Cur_Name: string,
    Cur_OfficialRate: number
  }

  const [data, setData] = useState<Array<ApiData>>()
  const [filteredData, setFilteredData] = useState<Array<ApiData>>()
  const [selectedCategories, setSelectedCategories] = useState<Array<string>>([])
  const [categories, setCategories] = useState<Array<string>>([])
  const [showFiltersCheckbox, setShowFiltersCheckbox] = useState<boolean>(false)
  const [sale, setSale] = useState<boolean>(false)
  const [markdown, setMarkdown] = useState<boolean>(false)
  const [currency, setCurrency] = useState<BankData>()
  
  type StockOption = "акция" | "уценка";

  const loadDataFromSheet = async (URL: string) => {
    const dataUrl = await fetch(URL);
    const res =  await dataUrl.text()
    const json: Array<ApiData> = await csvToJson().fromString(res)
    setData(json)
    setFilteredData(json)
    setCategories(getAllCategories(json))
  }

  const categoriesChangeHandle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const category = event.target.value;

    setSale(false);
    setMarkdown(false);

    event.target.checked ? selectedCategories.push(category) : selectedCategories.splice(selectedCategories.indexOf(category), 1)

    selectedCategories.length === 0 ? setFilteredData(data)
    : setFilteredData(data?.filter((item) => selectedCategories.includes(item.category)))
  } 

  const searchHandle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const text = event.target.value;

    selectedCategories.length === 0 ? setFilteredData(data?.filter((item) => searchTextInObject(text, item)))
    : setFilteredData(data?.filter((item) => searchTextInObject(text, item) && selectedCategories.includes(item.category)))
  }

  const searchTextInObject = (text: string, item: ApiData): boolean => {
    for (let value of Object.values(item)) {
      const field = value.toLowerCase().replaceAll(/[/,.-\s]/g, '')
      const textToSearch = text.toLowerCase().replaceAll(/[/,.-\s]/g, '')
      if (field.includes(textToSearch)) {
        return true;
      }
    }

    return false;
  }

  const getAllCategories = (data: Array<ApiData>) => {
    const allCategories: Array<string> = []

    data.forEach((item) => {
      const itemCategory = item.category;
      if(!allCategories.includes(itemCategory) && itemCategory.length !== 0) {
        allCategories.push(itemCategory)
      }
    })
   
    return allCategories
  }

  const pageHandler = (event: React.MouseEvent<HTMLElement>) => {
    if (!showFiltersCheckbox) {
      return
    }

    if (event.target instanceof Element) {
      const classClicked = event.target.className;

      if (classClicked !== 'messageCheckbox' && classClicked !== 'categories' && classClicked !== 'categoryLabel') {
        setShowFiltersCheckbox(false)
      }
    }
  }

  const onStockHandle = (stockOption: StockOption) => {
    let newStockValue;

    if (stockOption === "акция") { 
      setSale(!sale)
      newStockValue = sale;
      setMarkdown(false)
    } else {
      setMarkdown(!markdown)
      newStockValue = markdown;
      setSale(false)
    }

    selectedCategories.length === 0 
          ? newStockValue 
            ? setFilteredData(data)
            : setFilteredData(data?.filter((item) => searchTextInObject(stockOption, item)))
          : newStockValue 
            ? setFilteredData(data?.filter((item) => selectedCategories.includes(item.category)))
            : setFilteredData(data?.filter((item) => selectedCategories.includes(item.category) && searchTextInObject(stockOption, item)))
  }

  const loadCurrencyFromBank = async () => {
    const data = await fetch("https://www.nbrb.by/api/exrates/rates/431");
    setCurrency(await data.json())
  }

  const getRublePrice = (price: string): number => {
    price = price.replace(',', '.')
    
    if (!isNaN(+price) && currency) {
      return (+price) * (currency.Cur_OfficialRate + 0.01)
    }

    return 0
  }

  useEffect(() => {
    loadDataFromSheet(URL)
    loadCurrencyFromBank()
  }, [])

  return (
    <section onClick={(event) => pageHandler(event)}>
      <div className='header'>
        <div className='infoBlock'>
            <input className='searchInput' onChange={searchHandle}  placeholder="Search..."/>
            <div>
              <button 
                className='categoriesButton' 
                onClick={() => setShowFiltersCheckbox(!showFiltersCheckbox)} 
                style={{backgroundColor: selectedCategories.length !== 0 ? "yellow" : "white"}}>
                {showFiltersCheckbox ? 'CLOSE' : 'FILTER'}
              </button>
              <button className={`salesButton ${sale && 'saleSuccess'}`} onClick={() => onStockHandle("акция")}>
                Акции
              </button>
              <button className={`salesButton ${markdown && 'saleSuccess'}`} onClick={() => onStockHandle("уценка")}>
                Уценка
              </button>
              <div className='categories' style={{display: showFiltersCheckbox ? "block" : "none"}}>
                {categories.map((category) => 
                  <label className='categoryLabel'>
                    <input className="messageCheckbox" 
                      type="checkbox" 
                      value={category} 
                      name="categories" 
                      onChange={categoriesChangeHandle}/>
                      {category} <br/>
                  </label> 
                )}
              </div>
            </div>
            
        </div>
        {currency && (currency.Cur_OfficialRate + 0.01).toFixed(2)}
      </div>
      <div className='section'>
        <table className='table'>
          <tr>
            <th>артикул</th>
            <th>описание</th>
            <th>кол-во</th>
            <th>ц</th>
          </tr>
          {filteredData?.map((item) => 
          <tr>
            <td>{item["артикул"]}</td>
            <td>{item["описание"]}</td>
            <td>{item["кол-во"]}</td>
            <td>{item["ц"]} {item["ц"] && <span className='rublePrice'>/ {getRublePrice(item["ц"]).toFixed(1)}</span>}</td>
          </tr>
          )}  
        </table>
      </div>
    </section>
  )
}
