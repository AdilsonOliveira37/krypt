import { ChangeEvent, createContext, Dispatch, ReactNode, useEffect, useState } from "react";

import { ethers } from "ethers";
import { contractABI, contractAddress } from "../utils/constants";

declare global {
  interface Window {
    ethereum: any;
  }
}

type TransactionProviderProps = {
  children: ReactNode;
}

type FormDataType = {
  addressTo: string;
  amount: string;
  keyword: string;
  message: string;
}

type TransactionContextType = {
  connectWallet?: () => void;
  currentAccount?: any;
  formData: FormDataType;
  setFormData: (formData: FormDataType) => void;
  handleChange: (event: ChangeEvent<HTMLInputElement>, name: string) => void;
  sendTransaction: () => void;
}

export const TransactionContext = createContext<TransactionContextType>({} as TransactionContextType);

const { ethereum } = window;

const getEthereumContract = () => {
  const provider = new ethers.providers.Web3Provider(ethereum);
  const signer = provider.getSigner();
  const transactionContract = new ethers.Contract(contractAddress, contractABI, signer);

  return transactionContract;
}

export const TransactionProvider = ({ children }: TransactionProviderProps) => {
  const [currentAccount, setCurrentAccount] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [transactionCount, setTransactionCount] = useState(localStorage.getItem('@transactionCount'));
  const [formData, setFormData] = useState({
    addressTo: "",
    amount: "",
    keyword: "",
    message: "",
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>, name: string) => {
    setFormData(prevState => ({ ...prevState, [name]: e.target.value }));
  }

  const checkWalletIsConnected = async () => {
    try {
      if (!ethereum) return alert("Please install Metamask");
      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length) {
        setCurrentAccount(accounts[0]);

        //getAllTransactions();
      } else {
        console.log('No accounts found')
      }
    } catch (error) {
      console.log(error);

      throw new Error('No Ethereum object found');
    }

  }

  const connectWallet = async () => {
    try {
      if (!ethereum) return alert("Please install Metamask");
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);

      throw new Error('No Ethereum object found');
    }
  }

  const sendTransaction = async () => {
    try {
      if (!ethereum) return alert("Please install Metamask");

      const { addressTo, amount, keyword, message } = formData;
      const transactionContract = getEthereumContract();

      const parsedAmount = ethers.utils.parseEther(amount);

      await ethereum.request({
        method: "eth_sendTransaction",
        params: [{
          from: currentAccount,
          to: addressTo,
          gas: '0x5208', // 21000 GWEI
          value: parsedAmount._hex, // 0.0001 ETH
        }]
      });

      const transactionHash = await transactionContract.addToBlockchain(addressTo, parsedAmount, message, keyword);
      setIsLoading(true);
      await transactionHash.wait();
      setIsLoading(false);

      const transactionCount = await transactionContract.getTransactionCount(currentAccount);
      setTransactionCount(transactionCount.toNumber());
    } catch (error) {
      console.log(error);

      throw new Error('No Ethereum object found');
    }
  }

  useEffect(() => {
    checkWalletIsConnected();
  }, [])

  return (
    <TransactionContext.Provider value={{ connectWallet, currentAccount, formData, setFormData, handleChange, sendTransaction }}>
      {children}
    </TransactionContext.Provider>
  );
};

