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
  currentAccount?: any;
  formData: FormDataType;
  transactions: TransactionType[];
  isLoading: boolean;
  connectWallet?: () => void;
  setFormData: (formData: FormDataType) => void;
  handleChange: (event: ChangeEvent<HTMLInputElement>, name: string) => void;
  sendTransaction: () => void;
}

type GetTransactionProps = {
  receiver: string;
  sender: string;
  message: string;
  timestamp: any;
  amount: {
    _hex: string;
    _isBigNumber: boolean;
  };
  keyword?: string;
};

type TransactionType = {
  addressTo: string;
  addressFrom: string;
  timestamp: string;
  message: string;
  keyword: string | undefined;
  amount: number;
};

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
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [formData, setFormData] = useState({
    addressTo: "",
    amount: "",
    keyword: "",
    message: "",
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>, name: string) => {
    setFormData(prevState => ({ ...prevState, [name]: e.target.value }));
  }

  const getAllTransactions = async () => {
    try {
      if (!ethereum) return alert("Please install Metamask");
      const transactionsContract = getEthereumContract();

      const availableTransactions: GetTransactionProps[] = await transactionsContract.getAllTransactions();


      const structuredTransactions = availableTransactions.map((transaction) => ({
        addressTo: transaction.receiver,
        addressFrom: transaction.sender,
        timestamp: new Date(transaction.timestamp.toNumber() * 1000).toLocaleString(),
        message: transaction.message,
        keyword: transaction.keyword,
        amount: parseInt(transaction.amount._hex) * (10 ** 18),
      }));

      setTransactions(structuredTransactions);

    } catch (error) {
      console.log(error);
    }
  }

  const checkWalletIsConnected = async () => {
    try {
      if (!ethereum) return alert("Please install Metamask");
      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length) {
        setCurrentAccount(accounts[0]);

        getAllTransactions();
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

  const checkIfTransactionExists = async () => {
    try {
      const transactionContract = getEthereumContract();
      const transactionCount = await transactionContract.getTransactionCount(currentAccount);

      window.localStorage.setItem('@transactionCount', transactionCount);
    } catch (error) {
      console.log(error);

      throw new Error('No Ethereum object found');
    }
  }

  useEffect(() => {
    checkWalletIsConnected();
    checkIfTransactionExists();
  }, [])

  return (
    <TransactionContext.Provider
      value={{
        connectWallet,
        currentAccount,
        formData,
        setFormData,
        handleChange,
        sendTransaction,
        transactions,
        isLoading,
      }}>
      {children}
    </TransactionContext.Provider>
  );
};

