import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Trash2, Crown } from 'lucide-react'

interface ParticipantInputProps {
    index: number
    participant: { name: string; isNew: boolean }
    isHost: boolean
    onHostChange: () => void
    onNameChange: (value: string) => void
    onNewChange: (value: boolean) => void
    onRemove: () => void
    canRemove: boolean
}

export default function ParticipantInput({
    index,
    participant,
    isHost,
    onHostChange,
    onNameChange,
    onNewChange,
    onRemove,
    canRemove,
}: ParticipantInputProps) {
    return (
        <div className="flex items-center gap-3 p-3 bg-secondary border border-border rounded-lg">
            <button
                onClick={onHostChange}
                className={`flex-shrink-0 px-3 py-2 rounded-md font-semibold transition-all ${isHost
                        ? 'bg-primary text-white'
                        : 'bg-background border border-border text-primary hover:bg-secondary/80'
                    }`}
                title="벙주 선택"
            >
                <Crown size={18} />
            </button>

            <Input
                type="text"
                placeholder={`참석자 ${index + 1}`}
                value={participant.name}
                onChange={(e) => onNameChange(e.target.value)}
                className="flex-1 border border-border focus:ring-primary focus:border-primary h-9"
            />

            <label className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-md cursor-pointer hover:bg-secondary transition-all">
                <Checkbox
                    checked={participant.isNew}
                    onCheckedChange={(checked) => onNewChange(checked as boolean)}
                    className="border border-border"
                />
                <span className="text-xs font-semibold text-foreground whitespace-nowrap">신입</span>
            </label>

            {canRemove && (
                <button
                    onClick={onRemove}
                    className="flex-shrink-0 p-2 text-[#d97070] hover:bg-[#ffe8e8] rounded-md transition-all"
                    title="제거"
                >
                    <Trash2 size={18} />
                </button>
            )}
        </div>
        )
}
