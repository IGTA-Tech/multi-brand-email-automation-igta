import React, { useState } from 'react';
import { Mail, Send, Users, Calendar, Zap, Settings, BarChart3, FileText, AlertCircle, CheckCircle, Clock, Bot } from 'lucide-react';

// Imaginary data structures
const MOCK_WORKSPACES = [
  { id: 'ws1', email: 'workspace1@acmevisa.com', name: 'Primary Workspace' },
  { id: 'ws2', email: 'workspace2@acmevisa.com', name: 'Secondary Workspace' },
  { id: 'ws3', email: 'workspace3@acmevisa.com', name: 'Regional Workspace' }
];

const MOCK_BRANDS = [
  {
    id: 'brand1',
    name: 'Elite Sports Visas',
    email: 'hello@elitesportsvisas.com',
    voice: 'Professional yet encouraging. We work with top athletes worldwide.',
    signature: 'Best regards,\nElite Sports Visas Team\nwww.elitesportsvisas.com'
  },
  {
    id: 'brand2',
    name: 'Global Talent Immigration',
    email: 'support@globaltalent.com',
    voice: 'Warm and approachable. We simplify complex immigration processes.',
    signature: 'Warm regards,\nGlobal Talent Immigration\nwww.globaltalent.com'
  },
  {
    id: 'brand3',
    name: 'Artist Visa Specialists',
    email: 'info@artistvisas.com',
    voice: 'Creative and supportive. We champion artists and performers.',
    signature: 'Creatively yours,\nArtist Visa Specialists\nwww.artistvisas.com'
  }
];

const MOCK_CONTACTS = [
  {
    id: 'C-001',
    firstName: 'Marcus',
    lastName: 'Johnson',
    email: 'marcus.j@example.com',
    leadStatus: 'Hot Lead',
    leadScore: 9,
    visaType: 'O-1A',
    totalEmailsSent: 2,
    last7DaysCount: 1,
    last24HoursCount: 0,
    lastContactedDate: '2025-10-10',
    engagementScore: 75,
    associatedBrands: ['brand1']
  },
  {
    id: 'C-002',
    firstName: 'Sofia',
    lastName: 'Martinez',
    email: 'sofia.m@example.com',
    leadStatus: 'Warm Lead',
    leadScore: 7,
    visaType: 'P-1A',
    totalEmailsSent: 5,
    last7DaysCount: 2,
    last24HoursCount: 1,
    lastContactedDate: '2025-10-16',
    engagementScore: 60,
    associatedBrands: ['brand1', 'brand2']
  },
  {
    id: 'C-003',
    firstName: 'David',
    lastName: 'Chen',
    email: 'david.c@example.com',
    leadStatus: 'Cold Lead',
    leadScore: 4,
    visaType: 'EB-1A',
    totalEmailsSent: 8,
    last7DaysCount: 3,
    last24HoursCount: 0,
    lastContactedDate: '2025-10-14',
    engagementScore: 25,
    associatedBrands: ['brand3']
  },
  {
    id: 'C-004',
    firstName: 'Emma',
    lastName: 'Williams',
    email: 'emma.w@example.com',
    leadStatus: 'Hot Lead',
    leadScore: 10,
    visaType: 'O-1B',
    totalEmailsSent: 1,
    last7DaysCount: 0,
    last24HoursCount: 0,
    lastContactedDate: '2025-10-08',
    engagementScore: 90,
    associatedBrands: ['brand3']
  }
];

const MOCK_TEMPLATES = [
  {
    id: 'T-001',
    name: 'Hot Lead Follow-up',
    brandId: 'brand1',
    category: 'Follow-up',
    subject: 'Hi {firstName}, your {visaType} next steps',
    body: `Hi {firstName},\n\nI hope this finds you well. I wanted to follow up on your {visaType} inquiry.\n\nIt's been {daysSinceContact} days since we last connected. Here's what I can help with:\n\n• Free case evaluation\n• Timeline overview\n• Answer any questions\n\nReply to this email or schedule a call.\n\n{signature}`
  },
  {
    id: 'T-002',
    name: 'Cold Lead Re-engagement',
    brandId: 'brand1',
    category: 'Nurture',
    subject: 'Quick check-in about your {visaType}',
    body: `Hi {firstName},\n\nI haven't heard back in a while and wanted to check in.\n\nIf you're still interested in your {visaType}, I'm here to help. No pressure—just letting you know the door is open.\n\nFeel free to reach out when ready.\n\n{signature}`
  }
];

const EmailAutomationDemo = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [messageMode, setMessageMode] = useState('template'); // template, manual, claude
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [deliveryMode, setDeliveryMode] = useState('sendNow'); // sendNow, scheduled, recurring, autoPilot
  const [generatingWithClaude, setGeneratingWithClaude] = useState(false);
  const [claudeEmail, setClaudeEmail] = useState(null);
  const [campaignStep, setCampaignStep] = useState(1);
  const [frequencyWarnings, setFrequencyWarnings] = useState([]);
  const [campaignQueue, setCampaignQueue] = useState([]);

  // Simulate Claude email generation
  const generateWithClaude = async (contact) => {
    setGeneratingWithClaude(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const brand = MOCK_BRANDS.find(b => b.id === selectedBrand);
    const daysSince = Math.floor((new Date() - new Date(contact.lastContactedDate)) / (1000 * 60 * 60 * 24));

    // Simulated Claude response
    const generated = {
      subject: `${contact.firstName}, let's talk about your ${contact.visaType} opportunity`,
      body: `Hi ${contact.firstName},\n\nI noticed it's been ${daysSince} days since we last connected about your ${contact.visaType} visa application.\n\nGiven your ${contact.leadStatus.toLowerCase()} status and impressive background, I wanted to personally reach out with some specific next steps that could accelerate your process:\n\n• A customized timeline based on your situation\n• Key documentation you'll need\n• Success stories from similar cases\n\nI have time this week for a brief call if you'd like to discuss. Just reply to this email.\n\n${brand.signature}`,
      generatedBy: 'Claude Sonnet 4.5',
      personalizationScore: 92
    };

    setClaudeEmail(generated);
    setGeneratingWithClaude(false);
  };

  // Check frequency limits
  const checkFrequencyLimits = (contacts, brandId) => {
    const warnings = [];
    const brand = MOCK_BRANDS.find(b => b.id === brandId);

    contacts.forEach(contact => {
      // 24-hour limit
      if (contact.last24HoursCount >= 1) {
        warnings.push({
          contactId: contact.id,
          contactName: `${contact.firstName} ${contact.lastName}`,
          severity: 'error',
          message: 'Already sent 1 email in last 24 hours (BLOCKED)'
        });
      }

      // 7-day limit
      if (contact.last7DaysCount >= 3) {
        warnings.push({
          contactId: contact.id,
          contactName: `${contact.firstName} ${contact.lastName}`,
          severity: 'warning',
          message: `Sent ${contact.last7DaysCount}/3 emails in last 7 days (approaching limit)`
        });
      }

      // Brand-specific check
      if (!contact.associatedBrands.includes(brandId)) {
        warnings.push({
          contactId: contact.id,
          contactName: `${contact.firstName} ${contact.lastName}`,
          severity: 'info',
          message: `Not previously contacted by ${brand.name}`
        });
      }
    });

    setFrequencyWarnings(warnings);
    return warnings;
  };

  // Create campaign
  const createCampaign = () => {
    const brand = MOCK_BRANDS.find(b => b.id === selectedBrand);
    const workspace = MOCK_WORKSPACES.find(w => w.id === selectedWorkspace);

    const validContacts = selectedContacts.filter(c =>
      !frequencyWarnings.find(w => w.contactId === c.id && w.severity === 'error')
    );

    const newCampaign = {
      id: `CMP-${Date.now()}`,
      name: `${brand.name} Campaign - ${new Date().toLocaleDateString()}`,
      brandId: selectedBrand,
      brandName: brand.name,
      workspaceId: selectedWorkspace,
      workspaceName: workspace.name,
      contacts: validContacts.length,
      deliveryMode: deliveryMode,
      messageType: messageMode,
      status: deliveryMode === 'sendNow' ? 'sending' : 'scheduled',
      createdAt: new Date().toISOString(),
      sentCount: deliveryMode === 'sendNow' ? validContacts.length : 0,
      openCount: 0,
      clickCount: 0
    };

    setCampaignQueue([newCampaign, ...campaignQueue]);

    // Reset form
    setCampaignStep(1);
    setSelectedContacts([]);
    setSelectedTemplate(null);
    setClaudeEmail(null);
    setFrequencyWarnings([]);
    setActiveTab('campaigns');
  };

  // Render campaign creation wizard (truncated for brevity - see full file)
  const renderCampaignWizard = () => {
    // ... (implementation continues)
    return <div>Campaign Wizard UI</div>;
  };

  // Render dashboard
  const renderDashboard = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-blue-500" />
              <span className="text-2xl font-bold">{MOCK_CONTACTS.length}</span>
            </div>
            <div className="text-sm text-gray-600">Total Contacts</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <Mail className="w-8 h-8 text-green-500" />
              <span className="text-2xl font-bold">{campaignQueue.length}</span>
            </div>
            <div className="text-sm text-gray-600">Active Campaigns</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <Send className="w-8 h-8 text-purple-500" />
              <span className="text-2xl font-bold">
                {campaignQueue.reduce((sum, c) => sum + c.sentCount, 0)}
              </span>
            </div>
            <div className="text-sm text-gray-600">Emails Sent</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-8 h-8 text-orange-500" />
              <span className="text-2xl font-bold">24%</span>
            </div>
            <div className="text-sm text-gray-600">Avg Open Rate</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">System Overview</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium">All Systems Operational</span>
              </div>
              <span className="text-sm text-green-600">Last check: 2 mins ago</span>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="p-3 border border-gray-200 rounded">
                <div className="text-sm text-gray-600 mb-1">Google Workspace</div>
                <div className="font-semibold text-green-600">Connected</div>
              </div>
              <div className="p-3 border border-gray-200 rounded">
                <div className="text-sm text-gray-600 mb-1">n8n Workflows</div>
                <div className="font-semibold text-green-600">5 Active</div>
              </div>
              <div className="p-3 border border-gray-200 rounded">
                <div className="text-sm text-gray-600 mb-1">Claude API</div>
                <div className="font-semibold text-green-600">Ready</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Multi-Brand Email Automation - IGTA Version</h1>
              <p className="text-sm text-gray-600">Powered by n8n, Google Sheets & Claude AI</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-semibold">3 Workspaces</div>
                <div className="text-xs text-gray-600">5 Active Workflows</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-6">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'create', label: 'Create Campaign', icon: Send },
              { id: 'campaigns', label: 'Campaigns', icon: Mail },
              { id: 'contacts', label: 'Contacts', icon: Users },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-4 border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'create' && renderCampaignWizard()}
      </div>
    </div>
  );
};

export default EmailAutomationDemo;
