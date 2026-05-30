export interface AprilBranch {
    id: string;
    name: string;
    city: string;
    status: 'active' | 'pending' | 'completed';
  }
  
  export interface Lead {
    id: string;
    clientName: string;
    phone: string;
    status: 'new' | 'contacted' | 'closed';
    createdAt: string;
  }