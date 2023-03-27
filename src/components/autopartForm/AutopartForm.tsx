import React, { ButtonHTMLAttributes, useEffect } from 'react'
import './AutopartForm.css'

export interface AutopartFormProps {
  show: boolean
  onClose: () => void
  className?: string
}

const token = process.env.REACT_APP_TELEGRAM_TOKEN;
const chat_id = process.env.REACT_APP_TELEGRAM_CHAT_ID;

export const AutopartForm = ({ show, className, onClose }: AutopartFormProps) => {

  const onSubmitHandler = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()


    const articleInput = document.getElementById("autopartArticle") as HTMLInputElement
    const brandInput = document.getElementById("autopartBrand") as HTMLInputElement
    const countInput = document.getElementById("autopartCount") as HTMLInputElement
    const refInput = document.getElementById("autopartRef") as HTMLInputElement
    const contactInput = document.getElementById("autopartContact") as HTMLInputElement

    const articleText = articleInput.value;
    const brandText = brandInput.value
    const countText = countInput.value;
    const refText = refInput.value
    const contactText = contactInput.value;

    if (contactText === '') {
      alert('Введите контакты')
      return
    }

    const message = `${articleText}%0A${brandText}%0A${countText}%0A${refText}%0A${contactText}%0A${getContactMessanger()}`

    const url = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chat_id}&text=${message}`

    let api = new XMLHttpRequest();
    api.open("GET", url, true);
    api.send();

    onClose()

    alert('Для поиска наилучшего предложения потребуется некоторое время. Ответ будет выслан максимально быстро.\nСпасибо!')

    articleInput.value = ''
    brandInput.value = ''
    countInput.value = ''
    refInput.value = ''

  }

  const getContactMessanger = (): Array<string> => {
    const constacts: Array<HTMLInputElement> = Array.from(document.querySelectorAll('input[name="categories"]'))
    const res = []

    for (let contact of constacts) {
      if (contact.checked) {
        res.push(contact.value)
      }
    }

    return res
  }

  const onCloseHandler = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    
    onClose()
  }

  return (
    <div style={{ display: show ? 'block' : 'none' }}>
      <div className='blackBg'></div>
      <form className={className}>
        <h1>Создать запрос </h1>
        <span>Если возможны аналоги - создайте отдельный запрос для них.</span>
        <div className='infoInput'>
          <label>
            TecDoc артикул: <input id="autopartArticle"></input>
          </label>
          <label>
            Бренд: <input id="autopartBrand"></input>
          </label>
          <label>
            Кол-во: <input type="number" id="autopartCount" min={1}></input>
          </label>
          <label>
            Ссылка: <input id="autopartRef"></input>
          </label>
          <label>
            Контакт для получения ответа: <input type="tel" id="autopartContact" pattern="[0-9]{11}" />
          </label>
          <div className='contactSection'>
            <label className='categoryLabel'>
              <input className="messageCheckbox"
                type="checkbox"
                value={'whatsApp'}
                name="categories" />
              WhatsApp <br />
            </label>
            <label className='categoryLabel'>
              <input className="messageCheckbox"
                type="checkbox"
                value={'telegram'}
                name="categories" />
              Telegram <br />
            </label>
            <label className='categoryLabel'>
              <input className="messageCheckbox"
                type="checkbox"
                value={'viber'}
                name="categories" />
              viber <br />
            </label>
          </div>

        </div>
        <div className='buttons'>
          <button type="submit" onClick={onSubmitHandler}>Отправить на обработку</button>
          <button type="submit" onClick={onCloseHandler}>Закрыть</button>
        </div>
        <p>&#x26A1; Заказать товар можно только после согласования цены !!!</p>
      </form>
    </div>

  )
}
