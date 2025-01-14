import React, { useState, useRef } from 'react'
import styles from './styles.module.css'
import SearchButton from './buttons/SearchButton';

interface Props {
  placeholder?: string,
  debounce?: number,
  callback?: Function,
  city?: string,
  countrycodes?: string,
  acceptLanguage?: string,
  viewbox?: string
}

export interface Result {
  boundingbox: Array<string>,
  display_name: string,
  lat: string,
  lon: string
}

export class debouncedMethod<T>{
  private _method: T;
  private _timeout: number | undefined; // Allow _timeout to be undefined
  private _debounceTime: number;

  constructor(method: T, debounceTime: number) {
    this._method = method;
    this._debounceTime = debounceTime;
  }

  public invoke: T = ((...args: any[]) => {
    if (this._timeout !== undefined) {
      window.clearTimeout(this._timeout);
    }
    this._timeout = window.setTimeout(() => {
      (this._method as any)(...args);
    }, this._debounceTime);
  }) as any;
}

const renderResults = (results: any, callback: Function | undefined, setShowResults: React.Dispatch<React.SetStateAction<boolean>>) =>
  <div className={styles.results}>
    {results.map((result: Result, index: number) =>
      <div key={index} className={styles.result} onClick={() => {
        if (callback) {
          callback(result);
          setShowResults(false);
        }
      }}>
        {result?.display_name}
      </div>
    )}
  </div>


export const ReactOsmGeocoding = ({ placeholder = "Enter address", debounce = 1000, callback, countrycodes = "tr", acceptLanguage = "tr", viewbox = "" }: Props) => {
  const [results, setResults] = useState<Partial<Result[]>>([]);
  const [showResults, setShowResults] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const mainContainerRef = useRef<HTMLDivElement>(null);

  document.addEventListener('click', function (event) {
    var isClickInside = mainContainerRef?.current?.contains(event.target as Node);
    if (!isClickInside) {
      setShowResults(false);
    }
  });

  document.onkeyup = function (event) {
    if (event.key === "Escape") {
      setShowResults(false);
    }
  }

  function getGeocoding(address = "") {
    if (address.length === 0) return;

    setShowLoader(true);

    let url = `https://nominatim.openstreetmap.org/search?format=json&q=${address}&countrycodes=${countrycodes}&accept-language=${acceptLanguage}`;

    if (viewbox.length)
      url = `${url}&viewbox=${viewbox}&bounded=1`;

    fetch(url)
      .then(response => response.json())
      .then((data) => {
        setResults(data);
        setShowResults(true);
      })
      .catch(err => console.warn(err))
      .finally(() => setShowLoader(false));
  }

  var debouncer = new debouncedMethod((address: string) => {
    getGeocoding(address);
  }, debounce);



  return <div className={styles.reactOsmGeocoding} ref={mainContainerRef}>
    <input type="text" name="geocoding" id="geocoding" placeholder={placeholder}
      onClick={() => setShowResults(true)}
      onChange={event => debouncer.invoke(event.target.value)} />
    <SearchButton />
    {showLoader && <div className={styles.loader}></div>}
    {(results.length && showResults) ? renderResults(results, callback, setShowResults) : ""}
  </div>
}
